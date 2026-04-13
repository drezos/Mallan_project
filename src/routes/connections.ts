import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import axios from 'axios';
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

// GET /api/connections/google/search-console-sites?tenant_id={uuid}
// Lists Search Console sites available to the tenant's connected Google account.
router.get('/google/search-console-sites', async (req: Request, res: Response) => {
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

    const callSitesList = async (token: string) => {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ access_token: token });
      const webmasters = google.webmasters({
        version: 'v3',
        auth: oauth2Client,
      });
      return webmasters.sites.list();
    };

    let response;
    try {
      response = await callSitesList(accessToken);
    } catch (err: any) {
      // If the token was invalidated server-side, try one more time after refreshing.
      const status = err?.code || err?.response?.status;
      if ((status === 401 || status === 403) && refresh_token) {
        accessToken = await refreshGoogleAccessToken(tenant_id, refresh_token);
        response = await callSitesList(accessToken);
      } else {
        throw err;
      }
    }

    const siteEntries = response.data.siteEntry ?? [];
    const sites = siteEntries.map((site) => ({
      siteUrl: site.siteUrl ?? '',
      permissionLevel: site.permissionLevel ?? '',
    }));

    return res.json(sites);
  } catch (err: any) {
    console.error('Error fetching Search Console sites:', err);
    const message = err?.response?.data?.error?.message || err?.message || 'Unknown error';
    return res.status(500).json({ error: `Failed to fetch Search Console sites: ${message}` });
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

// GET /api/connections/google/selected-search-console-site?tenant_id={uuid}
// Returns the Search Console site the tenant has picked for their Google connection (if any).
router.get('/google/selected-search-console-site', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT selected_search_console_site_url
       FROM tenant_connections
       WHERE tenant_id = $1 AND platform = 'google'`,
      [tenant_id]
    );

    if (result.rows.length === 0 || !result.rows[0].selected_search_console_site_url) {
      return res.json({ siteUrl: null });
    }

    return res.json({
      siteUrl: result.rows[0].selected_search_console_site_url,
    });
  } catch (err) {
    console.error('Error fetching selected Search Console site:', err);
    return res.status(500).json({ error: 'Failed to fetch selected Search Console site' });
  }
});

// POST /api/connections/google/search-console-site
// Body: { tenant_id, siteUrl }
// Stores the Search Console site the tenant has picked for their Google connection.
router.post('/google/search-console-site', async (req: Request, res: Response) => {
  const { tenant_id, siteUrl } = req.body ?? {};

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }
  if (!siteUrl || typeof siteUrl !== 'string') {
    return res.status(400).json({ error: 'siteUrl is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE tenant_connections
       SET selected_search_console_site_url = $1
       WHERE tenant_id = $2 AND platform = 'google'`,
      [siteUrl, tenant_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No Google connection found for tenant' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving selected Search Console site:', err);
    return res.status(500).json({ error: 'Failed to save selected Search Console site' });
  }
});

// GET /api/connections/meta/facebook-pages?tenant_id={uuid}
// Lists Facebook Pages (with linked Instagram Business Accounts) available to
// the tenant's connected Meta account.
router.get('/meta/facebook-pages', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT access_token
       FROM tenant_connections
       WHERE tenant_id = $1 AND platform = 'meta'`,
      [tenant_id]
    );

    if (result.rows.length === 0 || !result.rows[0].access_token) {
      return res.status(401).json({ error: 'No Meta connection found for tenant' });
    }

    const accessToken: string = result.rows[0].access_token;

    // TODO: Meta tokens can be short-lived; exchange for a long-lived token
    // (GET /oauth/access_token?grant_type=fb_exchange_token) when we add a
    // dedicated refresh helper. For now we rely on the long-lived token
    // already stored at OAuth time.
    const response = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token,instagram_business_account',
      },
    });

    const pages = (response.data?.data ?? []).map((page: any) => ({
      pageId: page.id,
      name: page.name,
      pageAccessToken: page.access_token,
      instagramAccountId: page.instagram_business_account?.id ?? null,
    }));

    return res.json(pages);
  } catch (err: any) {
    console.error('Error fetching Facebook Pages:', err);
    const message =
      err?.response?.data?.error?.message || err?.message || 'Unknown error';
    return res.status(500).json({ error: `Failed to fetch Facebook Pages: ${message}` });
  }
});

// GET /api/connections/meta/selected-facebook-page?tenant_id={uuid}
// Returns the Facebook Page the tenant has picked for their Meta connection (if any).
router.get('/meta/selected-facebook-page', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT selected_facebook_page_id,
              selected_facebook_page_name,
              selected_facebook_instagram_account_id
       FROM tenant_connections
       WHERE tenant_id = $1 AND platform = 'meta'`,
      [tenant_id]
    );

    if (result.rows.length === 0 || !result.rows[0].selected_facebook_page_id) {
      return res.json({ pageId: null, pageName: null, instagramAccountId: null });
    }

    return res.json({
      pageId: result.rows[0].selected_facebook_page_id,
      pageName: result.rows[0].selected_facebook_page_name,
      instagramAccountId: result.rows[0].selected_facebook_instagram_account_id,
    });
  } catch (err) {
    console.error('Error fetching selected Facebook Page:', err);
    return res.status(500).json({ error: 'Failed to fetch selected Facebook Page' });
  }
});

// POST /api/connections/meta/facebook-page
// Body: { tenant_id, pageId, pageName, pageAccessToken, instagramAccountId }
// Stores the Facebook Page the tenant has picked for their Meta connection.
// The page_access_token is a Page-scoped token required for Insights API calls.
router.post('/meta/facebook-page', async (req: Request, res: Response) => {
  const { tenant_id, pageId, pageName, pageAccessToken, instagramAccountId } = req.body ?? {};

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }
  if (!pageId || typeof pageId !== 'string') {
    return res.status(400).json({ error: 'pageId is required' });
  }
  if (typeof pageName !== 'string') {
    return res.status(400).json({ error: 'pageName is required' });
  }
  if (!pageAccessToken || typeof pageAccessToken !== 'string') {
    return res.status(400).json({ error: 'pageAccessToken is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE tenant_connections
       SET selected_facebook_page_id = $1,
           selected_facebook_page_name = $2,
           selected_facebook_page_access_token = $3,
           selected_facebook_instagram_account_id = $4
       WHERE tenant_id = $5 AND platform = 'meta'`,
      [
        pageId,
        pageName,
        pageAccessToken,
        instagramAccountId ?? null,
        tenant_id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No Meta connection found for tenant' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving selected Facebook Page:', err);
    return res.status(500).json({ error: 'Failed to save selected Facebook Page' });
  }
});

export default router;
