import { google } from 'googleapis';
import { pool } from '../db/cache';
import { getValidAccessToken } from './tokenManager';

const CACHE_KEY_SUFFIX = 'dashboard:website';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

const TOKEN_REFRESH_URL = 'https://oauth2.googleapis.com/token';

export interface WebsitePillarMetric {
  current: number;
  previous: number;
  change: number;
}

export interface WebsitePillarDisconnected {
  connected: false;
}

export interface WebsitePillarConnected {
  connected: true;
  propertyId: string;
  propertyName: string;
  metrics: {
    sessions: WebsitePillarMetric;
    newUsers: WebsitePillarMetric;
    bounceRate: WebsitePillarMetric;
    engagementRate: WebsitePillarMetric;
  };
  topSources: Array<{ source: string; sessions: number }>;
}

export type WebsitePillar = WebsitePillarDisconnected | WebsitePillarConnected;

function cacheKeyFor(tenantId: string) {
  return `${tenantId}:${CACHE_KEY_SUFFIX}`;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  const change = ((current - previous) / previous) * 100;
  // Round to 1 decimal place
  return Math.round(change * 10) / 10;
}

function toMetric(current: number, previous: number): WebsitePillarMetric {
  return {
    current: Math.round(current * 10) / 10,
    previous: Math.round(previous * 10) / 10,
    change: pctChange(current, previous),
  };
}

async function readCache(tenantId: string): Promise<WebsitePillar | null> {
  try {
    const result = await pool.query(
      `SELECT data
       FROM tenant_cache
       WHERE tenant_id = $1 AND cache_key = $2 AND expires_at > NOW()`,
      [tenantId, cacheKeyFor(tenantId)]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].data as WebsitePillar;
  } catch (err) {
    console.error('[websitePillar] cache read error:', err);
    return null;
  }
}

async function writeCache(tenantId: string, data: WebsitePillar): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);
    await pool.query(
      `INSERT INTO tenant_cache (tenant_id, cache_key, data, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, cache_key)
       DO UPDATE SET data = $3, expires_at = $4, created_at = NOW()`,
      [tenantId, cacheKeyFor(tenantId), JSON.stringify(data), expiresAt]
    );
  } catch (err) {
    console.error('[websitePillar] cache write error:', err);
  }
}

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

async function fetchGa4WebsiteData(
  accessToken: string,
  propertyId: string
): Promise<{
  current: Record<string, number>;
  previous: Record<string, number>;
  topSources: Array<{ source: string; sessions: number }>;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  const analyticsdata = google.analyticsdata({
    version: 'v1beta',
    auth: oauth2Client,
  });
  const property = `properties/${propertyId}`;

  const metricDefs = [
    { name: 'sessions' },
    { name: 'totalUsers' }, // "new users" per task spec
    { name: 'bounceRate' },
    { name: 'engagementRate' },
  ];

  const [currentResp, previousResp, sourcesResp] = await Promise.all([
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
        metrics: metricDefs,
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: '14daysAgo', endDate: '8daysAgo' }],
        metrics: metricDefs,
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: '5',
      },
    }),
  ]);

  const parseRow = (row: any) => {
    const mv = row?.metricValues ?? [];
    return {
      sessions: parseFloat(mv[0]?.value ?? '0'),
      newUsers: parseFloat(mv[1]?.value ?? '0'),
      // GA4 returns bounceRate / engagementRate as 0..1 fractions — convert to percent
      bounceRate: parseFloat(mv[2]?.value ?? '0') * 100,
      engagementRate: parseFloat(mv[3]?.value ?? '0') * 100,
    };
  };

  const current = parseRow(currentResp.data.rows?.[0]);
  const previous = parseRow(previousResp.data.rows?.[0]);

  const topSources = (sourcesResp.data.rows ?? []).map((r) => ({
    source: r.dimensionValues?.[0]?.value ?? '(unknown)',
    sessions: parseInt(r.metricValues?.[0]?.value ?? '0', 10),
  }));

  return { current, previous, topSources };
}

export async function getWebsitePillar(tenantId: string): Promise<WebsitePillar> {
  // 1. Try cache
  const cached = await readCache(tenantId);
  if (cached) {
    return cached;
  }

  // 2. Look up Google connection + selected property for this tenant
  const connResult = await pool.query(
    `SELECT access_token, refresh_token, expires_at, selected_property_id, selected_property_name
     FROM tenant_connections
     WHERE tenant_id = $1 AND platform = 'google'`,
    [tenantId]
  );

  if (
    connResult.rows.length === 0 ||
    !connResult.rows[0].access_token ||
    !connResult.rows[0].selected_property_id
  ) {
    const disconnected: WebsitePillar = { connected: false };
    await writeCache(tenantId, disconnected);
    return disconnected;
  }

  const {
    refresh_token,
    selected_property_id: propertyId,
    selected_property_name: propertyName,
  } = connResult.rows[0];

  // 3. Obtain a valid access token (proactive refresh handled inside)
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(tenantId, 'google');
  } catch (err) {
    console.error('[websitePillar] token error for tenant', tenantId, ':', err);
    throw err;
  }

  // 4. Call GA4. On 401/403 (token invalidated server-side), refresh once and retry.
  let ga4Data;
  try {
    ga4Data = await fetchGa4WebsiteData(accessToken, propertyId);
  } catch (err: any) {
    const status = err?.code || err?.response?.status;
    if ((status === 401 || status === 403) && refresh_token) {
      accessToken = await refreshGoogleAccessToken(tenantId, refresh_token);
      ga4Data = await fetchGa4WebsiteData(accessToken, propertyId);
    } else {
      throw err;
    }
  }

  const result: WebsitePillarConnected = {
    connected: true,
    propertyId,
    propertyName: propertyName ?? '',
    metrics: {
      sessions: toMetric(ga4Data.current.sessions, ga4Data.previous.sessions),
      newUsers: toMetric(ga4Data.current.newUsers, ga4Data.previous.newUsers),
      bounceRate: toMetric(
        ga4Data.current.bounceRate,
        ga4Data.previous.bounceRate
      ),
      engagementRate: toMetric(
        ga4Data.current.engagementRate,
        ga4Data.previous.engagementRate
      ),
    },
    topSources: ga4Data.topSources,
  };

  await writeCache(tenantId, result);
  return result;
}
