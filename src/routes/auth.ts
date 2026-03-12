import { Router, Request, Response } from 'express';
import { google } from 'googleapis';

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
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.redirect(url);
});

// Step 2: Google sends user back here with a code
router.get('/callback/google', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code received from Google' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);

    // For now, log the tokens so we can confirm it works
    console.log('✅ Google tokens received:', {
      access_token: tokens.access_token ? 'present' : 'missing',
      refresh_token: tokens.refresh_token ? 'present' : 'missing',
      expiry_date: tokens.expiry_date,
    });

    // Temporary success response — we'll save to DB next
    res.json({
      success: true,
      message: 'Google connected successfully',
      has_refresh_token: !!tokens.refresh_token
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

export default router;
