import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { pool } from '../db/migrations';

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
);

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/adwords',
];

// Step 1: Send user to Google login page
router.get('/connect/google', (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: tenant_id as string,
  });
  res.redirect(url);
});

// Step 2: Google sends user back here with a code
router.get('/callback/google', async (req: Request, res: Response) => {
  const { code, state: tenant_id } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code received from Google' });
  }

  if (!tenant_id) {
    return res.status(400).json({ error: 'No tenant_id in OAuth state' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null;

    console.log(`Upserting tokens for tenant_id: ${tenant_id}`);

    await pool.query(
      `INSERT INTO tenant_connections (tenant_id, platform, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, platform)
       DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, tenant_connections.refresh_token),
         expires_at = EXCLUDED.expires_at,
         connected_at = NOW()`,
      [tenant_id, 'google', tokens.access_token, tokens.refresh_token ?? null, expiresAt]
    );

    console.log(`✅ Google tokens saved to tenant_connections for tenant ${tenant_id}`);

    res.json({
      success: true,
      message: 'Google connected successfully',
      has_refresh_token: !!tokens.refresh_token,
    });

  } catch (error) {
    console.error('Google OAuth error:', error instanceof Error ? error.stack : error);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

export default router;
