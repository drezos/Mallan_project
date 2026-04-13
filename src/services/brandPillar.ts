import { google } from 'googleapis';
import { pool } from '../db/cache';
import { getValidAccessToken } from './tokenManager';

const CACHE_KEY_SUFFIX = 'dashboard:brand';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

const TOKEN_REFRESH_URL = 'https://oauth2.googleapis.com/token';

export interface BrandPillarMetric {
  current: number;
  previous: number;
  change: number;
}

export interface BrandTopQuery {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
  ctr: number;
}

export interface BrandPillarDisconnected {
  connected: false;
}

export interface BrandPillarConnected {
  connected: true;
  siteUrl: string;
  metrics: {
    impressions: BrandPillarMetric;
    clicks: BrandPillarMetric;
    avgPosition: BrandPillarMetric;
    ctr: BrandPillarMetric;
  };
  topQueries: BrandTopQuery[];
}

export type BrandPillar = BrandPillarDisconnected | BrandPillarConnected;

function cacheKeyFor(tenantId: string) {
  return `${tenantId}:${CACHE_KEY_SUFFIX}`;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 10) / 10;
}

function toMetric(current: number, previous: number): BrandPillarMetric {
  return {
    current: Math.round(current * 10) / 10,
    previous: Math.round(previous * 10) / 10,
    change: pctChange(current, previous),
  };
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

async function readCache(tenantId: string): Promise<BrandPillar | null> {
  try {
    const result = await pool.query(
      `SELECT data
       FROM tenant_cache
       WHERE tenant_id = $1 AND cache_key = $2 AND expires_at > NOW()`,
      [tenantId, cacheKeyFor(tenantId)]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].data as BrandPillar;
  } catch (err) {
    console.error('[brandPillar] cache read error:', err);
    return null;
  }
}

async function writeCache(tenantId: string, data: BrandPillar): Promise<void> {
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
    console.error('[brandPillar] cache write error:', err);
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

interface ScRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

async function fetchSearchConsoleData(
  accessToken: string,
  siteUrl: string
): Promise<{
  current: { impressions: number; clicks: number; avgPosition: number; ctr: number };
  previous: { impressions: number; clicks: number; avgPosition: number; ctr: number };
  topQueries: BrandTopQuery[];
}> {
  // Build the googleapis auth client — same pattern as GA4 in websitePillar.ts
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

  // Last 7 days (ending yesterday) vs the 7 days before that
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const currentEnd = new Date(yesterday);
  const currentStart = new Date(yesterday);
  currentStart.setDate(currentStart.getDate() - 6);
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - 6);

  const [currentResp, previousResp, queriesResp] = await Promise.all([
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmtDate(currentStart),
        endDate: fmtDate(currentEnd),
        dimensions: ['date'],
      },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmtDate(previousStart),
        endDate: fmtDate(previousEnd),
        dimensions: ['date'],
      },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmtDate(currentStart),
        endDate: fmtDate(currentEnd),
        dimensions: ['query'],
        rowLimit: 10,
        orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
      },
    }),
  ]);

  const totals = (rows: ScRow[] | undefined) => {
    const list = rows ?? [];
    const impressions = list.reduce((s, r) => s + (r.impressions ?? 0), 0);
    const clicks = list.reduce((s, r) => s + (r.clicks ?? 0), 0);
    const avgPosition =
      list.length > 0
        ? list.reduce((s, r) => s + (r.position ?? 0), 0) / list.length
        : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    return { impressions, clicks, avgPosition, ctr };
  };

  const current = totals(currentResp.data.rows as ScRow[] | undefined);
  const previous = totals(previousResp.data.rows as ScRow[] | undefined);

  const topQueries: BrandTopQuery[] = ((queriesResp.data.rows ?? []) as ScRow[]).map(
    (row) => ({
      query: row.keys?.[0] ?? '',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      position: row.position ?? 0,
      ctr: (row.ctr ?? 0) * 100,
    })
  );

  return { current, previous, topQueries };
}

export async function getBrandPillar(tenantId: string): Promise<BrandPillar> {
  // 1. Try cache
  const cached = await readCache(tenantId);
  if (cached) {
    return cached;
  }

  // 2. Look up Google connection + selected Search Console site for this tenant
  const connResult = await pool.query(
    `SELECT access_token, refresh_token, selected_search_console_site_url
     FROM tenant_connections
     WHERE tenant_id = $1 AND platform = 'google'`,
    [tenantId]
  );

  if (
    connResult.rows.length === 0 ||
    !connResult.rows[0].access_token ||
    !connResult.rows[0].selected_search_console_site_url
  ) {
    console.log(`[brandPillar] No Search Console site selected for tenant ${tenantId}`);
    const disconnected: BrandPillar = { connected: false };
    await writeCache(tenantId, disconnected);
    return disconnected;
  }

  const {
    refresh_token,
    selected_search_console_site_url: siteUrl,
  } = connResult.rows[0];

  console.log(`[brandPillar] Fetching Search Console data for tenant ${tenantId} site ${siteUrl}`);

  // 3. Obtain a valid access token (proactive refresh handled inside)
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(tenantId, 'google');
  } catch (err) {
    console.error('[brandPillar] token error for tenant', tenantId, ':', err);
    throw err;
  }

  // 4. Call Search Console. On 401/403, refresh once and retry.
  let scData;
  try {
    scData = await fetchSearchConsoleData(accessToken, siteUrl);
  } catch (err: any) {
    const status = err?.code ?? err?.response?.status ?? err?.status;
    if ((status === 401 || status === 403) && refresh_token) {
      console.log(`[brandPillar] Token rejected (${status}); refreshing and retrying for tenant ${tenantId}`);
      accessToken = await refreshGoogleAccessToken(tenantId, refresh_token);
      scData = await fetchSearchConsoleData(accessToken, siteUrl);
    } else {
      console.error('[brandPillar] Search Console API error for tenant', tenantId, ':', err?.message ?? err);
      throw err;
    }
  }

  const result: BrandPillarConnected = {
    connected: true,
    siteUrl,
    metrics: {
      impressions: toMetric(scData.current.impressions, scData.previous.impressions),
      clicks: toMetric(scData.current.clicks, scData.previous.clicks),
      avgPosition: toMetric(scData.current.avgPosition, scData.previous.avgPosition),
      ctr: toMetric(scData.current.ctr, scData.previous.ctr),
    },
    topQueries: scData.topQueries,
  };

  await writeCache(tenantId, result);
  return result;
}
