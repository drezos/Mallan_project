import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { pool } from '../db/cache';

const router = Router();

// GET /api/connections?tenant_id={uuid}
// Returns which platforms have tokens stored for the given tenant.
router.get('/', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT platform FROM tenant_connections WHERE tenant_id = $1 AND access_token IS NOT NULL`,
      [tenant_id]
    );

    const connectedPlatforms = result.rows.map((r: any) => r.platform);

    return res.json({
      google: connectedPlatforms.includes('google'),
      meta: connectedPlatforms.includes('meta'),
      linkedin: connectedPlatforms.includes('linkedin'),
    });
  } catch (err) {
    console.error('Error fetching connections:', err);
    return res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

const TOKEN_REFRESH_URL = 'https://oauth2.googleapis.com/token';

async function refreshGoogleAccessToken(
  tenantId: string,
  refreshToken: string
): Promise<string> {
  const response = await fetch(TOKEN_REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Google token: ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  await pool.query(
    `UPDATE tenant_connections
     SET access_token = $1, expires_at = $2
     WHERE tenant_id = $3 AND platform = 'google'`,
    [data.access_token, newExpiresAt, tenantId]
  );

  return data.access_token;
}

// GET /api/connections/google/ga4-properties?tenant_id={uuid}
// Lists GA4 properties available to the tenant's connected Google account.
router.get('/google/ga4-properties', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT access_token, refresh_token, expires_at
       FROM tenant_connections
       WHERE tenant_id = $1 AND platform = 'google'`,
      [tenant_id]
    );

    if (result.rows.length === 0 || !result.rows[0].access_token) {
      return res.status(401).json({ error: 'No Google connection found for tenant' });
    }

    const { refresh_token, expires_at } = result.rows[0];
    let accessToken: string = result.rows[0].access_token;

    // Proactively refresh if the token is expired or about to expire.
    const expiryBufferMs = 5 * 60 * 1000;
    const isExpired =
      !expires_at || new Date(expires_at).getTime() <= Date.now() + expiryBufferMs;
    if (isExpired) {
      if (!refresh_token) {
        return res
          .status(401)
          .json({ error: 'Google access token expired and no refresh token available' });
      }
      accessToken = await refreshGoogleAccessToken(tenant_id, refresh_token);
    }

    const callAccountSummaries = async (token: string) => {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ access_token: token });
      const analyticsadmin = google.analyticsadmin({
        version: 'v1beta',
        auth: oauth2Client,
      });
      return analyticsadmin.accountSummaries.list({ pageSize: 200 });
    };

    let response;
    try {
      response = await callAccountSummaries(accessToken);
    } catch (err: any) {
      // If the token was invalidated server-side, try one more time after refreshing.
      const status = err?.code || err?.response?.status;
      if ((status === 401 || status === 403) && refresh_token) {
        accessToken = await refreshGoogleAccessToken(tenant_id, refresh_token);
        response = await callAccountSummaries(accessToken);
      } else {
        throw err;
      }
    }

    const summaries = response.data.accountSummaries ?? [];
    const properties = summaries.flatMap((acct) =>
      (acct.propertySummaries ?? []).map((prop) => ({
        propertyId: (prop.property ?? '').replace(/^properties\//, ''),
        displayName: prop.displayName ?? '',
        accountName: acct.displayName ?? '',
      }))
    );

    return res.json(properties);
  } catch (err: any) {
    console.error('Error fetching GA4 properties:', err);
    const message = err?.response?.data?.error?.message || err?.message || 'Unknown error';
    return res.status(500).json({ error: `Failed to fetch GA4 properties: ${message}` });
  }
});

// GET /api/connections/google/selected-property?tenant_id={uuid}
// Returns the GA4 property the tenant has picked for their Google connection (if any).
router.get('/google/selected-property', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT selected_property_id, selected_property_name
       FROM tenant_connections
       WHERE tenant_id = $1 AND platform = 'google'`,
      [tenant_id]
    );

    if (result.rows.length === 0 || !result.rows[0].selected_property_id) {
      return res.json({ propertyId: null, displayName: null });
    }

    return res.json({
      propertyId: result.rows[0].selected_property_id,
      displayName: result.rows[0].selected_property_name,
    });
  } catch (err) {
    console.error('Error fetching selected GA4 property:', err);
    return res.status(500).json({ error: 'Failed to fetch selected property' });
  }
});

// POST /api/connections/google/ga4-property
// Body: { tenant_id, propertyId, displayName }
// Stores the GA4 property the tenant has picked for their Google connection.
router.post('/google/ga4-property', async (req: Request, res: Response) => {
  const { tenant_id, propertyId, displayName } = req.body ?? {};

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }
  if (!propertyId || typeof propertyId !== 'string') {
    return res.status(400).json({ error: 'propertyId is required' });
  }
  if (typeof displayName !== 'string') {
    return res.status(400).json({ error: 'displayName is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE tenant_connections
       SET selected_property_id = $1, selected_property_name = $2
       WHERE tenant_id = $3 AND platform = 'google'`,
      [propertyId, displayName, tenant_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No Google connection found for tenant' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving selected GA4 property:', err);
    return res.status(500).json({ error: 'Failed to save selected property' });
  }
});

export default router;
