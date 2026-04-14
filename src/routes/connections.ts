import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import axios from 'axios';
import { GoogleAdsApi } from 'google-ads-api';
import { pool } from '../db/cache';
import { invalidateSocialPillarCache } from '../services/facebookSocialPillar';

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
      'linkedin-organic': connectedPlatforms.includes('linkedin-organic'),
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

// GET /api/connections/google/ads-accounts?tenant_id={uuid}
// Lists Google Ads accounts (customers) accessible to the tenant's connected
// Google account. Manager accounts are filtered out — only advertising
// accounts are returned.
//
// Required env:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET          (for OAuth)
//   GOOGLE_ADS_DEVELOPER_TOKEN                      (Google Ads API)
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID                    (Manager account ID used
//                                                    as login-customer-id on
//                                                    per-customer GAQL calls)
router.get('/google/ads-accounts', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  console.log('[googleAdsAccounts] entry', { tenant_id });

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

    if (!refresh_token) {
      return res
        .status(401)
        .json({ error: 'No Google refresh token available for tenant' });
    }

    // Proactively refresh the stored access token if expired. The Google Ads
    // client only needs the refresh_token, but we keep the stored access_token
    // fresh so subsequent callers (GA4, Search Console) don't hit a stale token.
    const expiryBufferMs = 5 * 60 * 1000;
    const isExpired =
      !expires_at || new Date(expires_at).getTime() <= Date.now() + expiryBufferMs;
    if (isExpired) {
      console.log('[googleAdsAccounts] refreshing access token', { tenant_id });
      await refreshGoogleAccessToken(tenant_id, refresh_token);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

    if (!clientId || !clientSecret || !developerToken) {
      return res.status(500).json({
        error:
          'Google Ads is not configured on the server (missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_ADS_DEVELOPER_TOKEN)',
      });
    }

    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });

    // 1. List accessible customers (returns resource names like "customers/1234567890").
    console.log('[googleAdsAccounts] listing accessible customers');
    let accessibleResourceNames: string[] = [];
    try {
      const listResp = await client.listAccessibleCustomers(refresh_token);
      accessibleResourceNames = listResp?.resource_names ?? [];
    } catch (listErr: any) {
      const msg =
        listErr?.errors?.[0]?.message ||
        listErr?.message ||
        'Unknown Google Ads error';
      console.error('[googleAdsAccounts] listAccessibleCustomers failed:', msg, listErr);
      if (
        /developer token/i.test(msg) ||
        /not approved/i.test(msg) ||
        /PERMISSION_DENIED/i.test(msg) ||
        /test access/i.test(msg)
      ) {
        return res.status(403).json({
          error:
            'Google Ads developer token was rejected. This is likely a Test Access ' +
            'limitation — the token needs Basic or Standard access approval, or the ' +
            'connected account must be listed as a test account. Details: ' +
            msg,
        });
      }
      return res.status(500).json({ error: `Failed to list Google Ads accounts: ${msg}` });
    }

    const customerIds = accessibleResourceNames
      .map((rn) => rn.replace(/^customers\//, ''))
      .filter((id) => id.length > 0);

    console.log(
      '[googleAdsAccounts] accessible customer count:',
      customerIds.length
    );

    // 2. For each customer, fetch metadata via GAQL and filter out manager accounts.
    //
    // We try two scopes per customer and keep whichever succeeds:
    //   a) Manager-scoped: login_customer_id = GOOGLE_ADS_LOGIN_CUSTOMER_ID.
    //      Works when the customer is linked under our Manager account.
    //   b) Direct-access:  no login_customer_id set.
    //      Works when the connected user has direct access to the customer
    //      (i.e. the customer was returned by listAccessibleCustomers and is
    //      NOT under our Manager).
    //
    // Setting login_customer_id to the Manager for a direct-access account
    // causes "User doesn't have permission to access customer" errors, so we
    // must fall back to a no-login_customer_id call in that case.
    type AccountMeta = {
      customerId: string;
      descriptiveName: string;
      currencyCode: string;
      timeZone: string;
    };

    const fetchMeta = async (
      customerId: string,
      scope: 'manager' | 'direct'
    ): Promise<AccountMeta | null | 'skip'> => {
      const customer = client.Customer({
        customer_id: customerId,
        refresh_token,
        ...(scope === 'manager' && loginCustomerId
          ? { login_customer_id: loginCustomerId }
          : {}),
      });

      const rows = await customer.query<any[]>(
        `SELECT
           customer.id,
           customer.descriptive_name,
           customer.currency_code,
           customer.time_zone,
           customer.manager
         FROM customer`
      );

      const row = rows?.[0];
      if (!row || !row.customer) {
        console.warn(
          '[googleAdsAccounts] no customer row returned for',
          customerId,
          `(scope=${scope})`
        );
        return null;
      }

      const c = row.customer;
      const isManager = c.manager === true;
      console.log(
        '[googleAdsAccounts] fetched',
        customerId,
        `name="${c.descriptive_name ?? ''}"`,
        `manager=${isManager}`,
        `scope=${scope}`
      );

      if (isManager) {
        return 'skip';
      }

      return {
        customerId: String(c.id ?? customerId),
        descriptiveName: c.descriptive_name ?? '',
        currencyCode: c.currency_code ?? '',
        timeZone: c.time_zone ?? '',
      };
    };

    const perCustomer = await Promise.all(
      customerIds.map(async (customerId) => {
        // Attempt Manager-scoped first (if we have a Manager configured), then
        // fall back to direct-access. Keep whichever succeeds.
        const attempts: Array<'manager' | 'direct'> = loginCustomerId
          ? ['manager', 'direct']
          : ['direct'];

        let lastErrMsg: string | null = null;

        for (const scope of attempts) {
          try {
            const meta = await fetchMeta(customerId, scope);
            if (meta === 'skip') {
              return null; // manager account — filter out
            }
            if (meta) {
              return meta;
            }
            // meta === null: no row; try next scope
          } catch (perErr: any) {
            const perMsg =
              perErr?.errors?.[0]?.message ||
              perErr?.message ||
              'Unknown Google Ads error';
            lastErrMsg = perMsg;

            // Treat deactivated / not-yet-enabled accounts as a normal skip:
            // there's nothing to fetch and no other scope will help.
            if (
              /not yet enabled/i.test(perMsg) ||
              /deactivated/i.test(perMsg) ||
              /CUSTOMER_NOT_ENABLED/i.test(perMsg)
            ) {
              console.log(
                '[googleAdsAccounts] skipping',
                customerId,
                '(account not enabled / deactivated):',
                perMsg
              );
              return null;
            }

            console.warn(
              '[googleAdsAccounts] metadata fetch attempt failed for',
              customerId,
              `(scope=${scope}):`,
              perMsg
            );
            // fall through to next scope
          }
        }

        console.error(
          '[googleAdsAccounts] failed to fetch metadata for',
          customerId,
          ':',
          lastErrMsg ?? 'no data returned'
        );
        return null;
      })
    );

    const accounts = perCustomer.filter(
      (a): a is AccountMeta => a !== null
    );

    console.log(
      '[googleAdsAccounts] returning',
      accounts.length,
      'accounts:',
      accounts.map((a) => a.customerId)
    );
    return res.json(accounts);
  } catch (err: any) {
    const msg =
      err?.errors?.[0]?.message ||
      err?.response?.data?.error?.message ||
      err?.message ||
      'Unknown error';
    console.error('[googleAdsAccounts] unexpected error:', msg, err);
    return res.status(500).json({ error: `Failed to fetch Google Ads accounts: ${msg}` });
  }
});

// GET /api/connections/google/selected-ads-account?tenant_id={uuid}
// Returns the Google Ads account the tenant has picked for their Google connection (if any).
router.get('/google/selected-ads-account', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT selected_google_ads_customer_id,
              selected_google_ads_account_name,
              selected_google_ads_currency_code
       FROM tenant_connections
       WHERE tenant_id = $1 AND platform = 'google'`,
      [tenant_id]
    );

    if (result.rows.length === 0 || !result.rows[0].selected_google_ads_customer_id) {
      return res.json({ customerId: null, descriptiveName: null, currencyCode: null });
    }

    return res.json({
      customerId: result.rows[0].selected_google_ads_customer_id,
      descriptiveName: result.rows[0].selected_google_ads_account_name,
      currencyCode: result.rows[0].selected_google_ads_currency_code,
    });
  } catch (err) {
    console.error('Error fetching selected Google Ads account:', err);
    return res.status(500).json({ error: 'Failed to fetch selected Google Ads account' });
  }
});

// POST /api/connections/google/ads-account
// Body: { tenant_id, customerId, descriptiveName, currencyCode }
// Stores the Google Ads account the tenant has picked for their Google connection.
router.post('/google/ads-account', async (req: Request, res: Response) => {
  const { tenant_id, customerId, descriptiveName, currencyCode } = req.body ?? {};

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }
  if (!customerId || typeof customerId !== 'string') {
    return res.status(400).json({ error: 'customerId is required' });
  }
  if (typeof descriptiveName !== 'string') {
    return res.status(400).json({ error: 'descriptiveName is required' });
  }
  if (typeof currencyCode !== 'string') {
    return res.status(400).json({ error: 'currencyCode is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE tenant_connections
       SET selected_google_ads_customer_id = $1,
           selected_google_ads_account_name = $2,
           selected_google_ads_currency_code = $3
       WHERE tenant_id = $4 AND platform = 'google'`,
      [customerId, descriptiveName, currencyCode, tenant_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No Google connection found for tenant' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving selected Google Ads account:', err);
    return res.status(500).json({ error: 'Failed to save selected Google Ads account' });
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

    // Drop the social pillar cache + the outer dashboard cache so the newly
    // selected page is picked up on the next dashboard fetch instead of
    // waiting for the 1h / 24h TTLs to expire.
    await invalidateSocialPillarCache(tenant_id);
    try {
      await pool.query(
        `DELETE FROM tenant_cache WHERE tenant_id = $1 AND cache_key = 'tenant_dashboard'`,
        [tenant_id]
      );
    } catch (cacheErr) {
      console.error('[connections] Failed to drop tenant_dashboard cache:', cacheErr);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving selected Facebook Page:', err);
    return res.status(500).json({ error: 'Failed to save selected Facebook Page' });
  }
});

// GET /api/connections/linkedin/pages?tenant_id={uuid}
// Lists LinkedIn Organizations (Company Pages) the tenant's connected LinkedIn
// account has ADMINISTRATOR access to.
//
// TODO: Reading organization data requires the "r_organization_social" (or
// "rw_organization_admin") scope. Our current LinkedIn OAuth scopes are:
// openid, profile, email, w_member_social. Until we add the scope via the
// LinkedIn Developer Portal Products tab and re-run the OAuth flow, this
// endpoint will return 403.
router.get('/linkedin/pages', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  console.log('[linkedinPages] entry', { tenant_id });

  if (!tenant_id || typeof tenant_id !== 'string') {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT access_token
       FROM tenant_connections
       WHERE tenant_id = $1 AND platform = 'linkedin'`,
      [tenant_id]
    );

    if (result.rows.length === 0 || !result.rows[0].access_token) {
      return res.status(401).json({ error: 'No LinkedIn connection found for tenant' });
    }

    const accessToken: string = result.rows[0].access_token;
    const maskedToken =
      accessToken.length > 8
        ? `${accessToken.slice(0, 4)}...${accessToken.slice(-4)}`
        : '****';
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': '202505',
      'X-Restli-Protocol-Version': '2.0.0',
    };

    const aclsUrl =
      'https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED';
    console.log('[linkedinPages] GET', aclsUrl, `(token=${maskedToken})`);

    const response = await axios.get(aclsUrl, { headers });

    const elements: any[] = response.data?.elements ?? [];
    console.log('[linkedinPages] organizationAcls returned', elements.length, 'elements');

    // Each element has an "organization" URN like "urn:li:organization:12345678".
    const orgIds: string[] = elements
      .map((el: any) => {
        const urn: string = el?.organization ?? '';
        const match = urn.match(/urn:li:organization:(\d+)/);
        return match ? match[1] : '';
      })
      .filter((id: string) => id.length > 0);

    console.log('[linkedinPages] extracted', orgIds.length, 'organization IDs');

    // Fetch each org's details in parallel; tolerate per-org failures.
    const pages = (
      await Promise.all(
        orgIds.map(async (organizationId) => {
          const orgUrl = `https://api.linkedin.com/rest/organizations/${organizationId}`;
          console.log('[linkedinPages] GET', orgUrl, `(token=${maskedToken})`);
          try {
            const orgResp = await axios.get(orgUrl, { headers });
            const org = orgResp.data ?? {};
            console.log(
              '[linkedinPages] org',
              organizationId,
              'ok:',
              org.localizedName ?? '(no name)'
            );
            return {
              organizationId: String(org.id ?? organizationId),
              name: org.localizedName ?? '',
              vanityName: org.vanityName ?? '',
            };
          } catch (orgErr: any) {
            console.error(
              '[linkedinPages] org',
              organizationId,
              'failed:',
              orgErr?.response?.status,
              orgErr?.response?.data?.message || orgErr?.message
            );
            return null;
          }
        })
      )
    ).filter((p): p is { organizationId: string; name: string; vanityName: string } => p !== null);

    console.log('[linkedinPages] returning', pages.length, 'pages');
    return res.json(pages);
  } catch (err: any) {
    const status = err?.response?.status;
    const linkedinError =
      err?.response?.data?.message ||
      err?.response?.data?.error_description ||
      err?.message ||
      'Unknown error';

    console.error('Error fetching LinkedIn Pages:', {
      status,
      data: err?.response?.data,
      message: err?.message,
    });

    if (status === 401) {
      return res.status(401).json({
        error: `LinkedIn access token invalid or expired: ${linkedinError}`,
      });
    }

    if (status === 403) {
      // TODO: Add "r_organization_social" (or "rw_organization_admin") scope
      // to the LinkedIn OAuth flow via LinkedIn Developer Portal Products tab.
      console.error(
        '[LinkedIn Pages] 403 - missing scope. Need r_organization_social ' +
          '(or rw_organization_admin). Current scopes: openid, profile, email, w_member_social.'
      );
      return res.status(403).json({
        error:
          'LinkedIn organization scope not authorized. Need r_organization_social scope from LinkedIn Developer Portal Products tab.',
      });
    }

    return res.status(500).json({ error: `Failed to fetch LinkedIn Pages: ${linkedinError}` });
  }
});

export default router;
