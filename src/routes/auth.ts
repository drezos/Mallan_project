import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import axios from 'axios';
import { pool } from '../db/migrations';
import { getGa4Metrics } from '../services/ga4Client';

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

const META_SCOPES = [
  'ads_read',
  'pages_show_list',
  'pages_read_engagement',
  'read_insights',
];

const LINKEDIN_SCOPES = [
  'r_ads_reporting',
  'r_ads',
  'r_basicprofile',
  'r_organization_social',
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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard?connected=google`);

  } catch (error) {
    console.error('Google OAuth error:', error instanceof Error ? error.stack : error);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

// Step 1: Send user to Facebook login page
router.get('/connect/meta', (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || '',
    redirect_uri: process.env.META_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/meta',
    scope: META_SCOPES.join(','),
    state: tenant_id as string,
    response_type: 'code',
  });

  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`);
});

// Step 2: Facebook sends user back here with a code
router.get('/callback/meta', async (req: Request, res: Response) => {
  const { code, state: tenant_id, error: oauthError } = req.query;

  if (oauthError) {
    return res.status(400).json({ error: `Facebook OAuth error: ${oauthError}` });
  }

  if (!code) {
    return res.status(400).json({ error: 'No code received from Facebook' });
  }

  if (!tenant_id) {
    return res.status(400).json({ error: 'No tenant_id in OAuth state' });
  }

  try {
    const redirectUri = process.env.META_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/meta';

    // Exchange auth code for a short-lived token
    const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    });
    const shortLivedToken: string = tokenRes.data.access_token;

    // Exchange short-lived token for a long-lived token (60 days)
    const longLivedRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });
    const longLivedToken: string = longLivedRes.data.access_token;
    const expiresInSeconds: number = longLivedRes.data.expires_in ?? 5184000; // default 60 days
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    console.log(`Upserting Meta tokens for tenant_id: ${tenant_id}`);

    // Meta doesn't issue refresh tokens — store null
    await pool.query(
      `INSERT INTO tenant_connections (tenant_id, platform, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, platform)
       DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = NULL,
         expires_at = EXCLUDED.expires_at,
         connected_at = NOW()`,
      [tenant_id, 'meta', longLivedToken, null, expiresAt]
    );

    console.log(`✅ Meta long-lived token saved to tenant_connections for tenant ${tenant_id}`);

    const frontendUrl = process.env.FRONTEND_URL || 'https://mallan-project.vercel.app';
    res.redirect(`${frontendUrl}/dashboard?connected=meta`);

  } catch (error) {
    console.error('Meta OAuth error:', error instanceof Error ? error.stack : error);
    res.status(500).json({ error: 'Failed to exchange code for Meta tokens' });
  }
});

// Step 1: Send user to LinkedIn login page
router.get('/connect/linkedin', (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID || '',
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/linkedin',
    scope: LINKEDIN_SCOPES.join(' '),
    state: tenant_id as string,
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
});

// Step 2: LinkedIn sends user back here with a code
router.get('/callback/linkedin', async (req: Request, res: Response) => {
  const { code, state: tenant_id, error: oauthError } = req.query;

  if (oauthError) {
    return res.status(400).json({ error: `LinkedIn OAuth error: ${oauthError}` });
  }

  if (!code) {
    return res.status(400).json({ error: 'No code received from LinkedIn' });
  }

  if (!tenant_id) {
    return res.status(400).json({ error: 'No tenant_id in OAuth state' });
  }

  try {
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/linkedin';

    const tokenRes = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID || '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken: string = tokenRes.data.access_token;
    const expiresInSeconds: number = tokenRes.data.expires_in ?? 5184000;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    console.log(`Upserting LinkedIn tokens for tenant_id: ${tenant_id}`);

    await pool.query(
      `INSERT INTO tenant_connections (tenant_id, platform, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, platform)
       DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = NULL,
         expires_at = EXCLUDED.expires_at,
         connected_at = NOW()`,
      [tenant_id, 'linkedin', accessToken, null, expiresAt]
    );

    console.log(`✅ LinkedIn token saved to tenant_connections for tenant ${tenant_id}`);

    const frontendUrl = process.env.FRONTEND_URL || 'https://mallan-project.vercel.app';
    res.redirect(`${frontendUrl}/dashboard?connected=linkedin`);

  } catch (error) {
    console.error('LinkedIn OAuth error:', error instanceof Error ? error.stack : error);
    res.status(500).json({ error: 'Failed to exchange code for LinkedIn token' });
  }
});

// Test endpoint: GET /api/auth/test-ga4?tenant_id=<uuid>
router.get('/test-ga4', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const metrics = await getGa4Metrics(tenant_id as string);
    res.json(metrics);
  } catch (error) {
    console.error('GA4 test error:', error instanceof Error ? error.stack : error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch GA4 metrics' });
  }
});

export default router;

// Debug router — mounted separately at /api/debug
const debugRouter = Router();

debugRouter.get('/meta-pages', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  const result = await pool.query(
    `SELECT access_token FROM tenant_connections WHERE tenant_id = $1 AND platform = 'meta'`,
    [tenant_id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'No Meta connection found for this tenant' });
  }

  const accessToken: string = result.rows[0].access_token;

  const fbRes = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
    params: { fields: 'id,name,access_token', access_token: accessToken },
  });

  res.json(fbRes.data);
});

export { debugRouter };
