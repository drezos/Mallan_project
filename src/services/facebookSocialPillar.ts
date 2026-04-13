import { pool } from '../db/cache';

const META_API_VERSION = 'v21.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

const CACHE_KEY_SUFFIX = 'dashboard:social';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// We fetch metrics one at a time so a single deprecated/invalid metric doesn't
// fail the whole batch. Keep the list aligned with the task spec.
const FB_METRICS = [
  'page_impressions_unique',
  'page_post_engagements',
  'page_follows',
  'page_daily_follows',
] as const;
type FbMetricName = (typeof FB_METRICS)[number];

// ===========================================
// Types
// ===========================================

export interface SocialPillarMetric {
  current: number;
  previous: number;
  change: number;
}

export interface FacebookPlatformConnected {
  connected: true;
  pageName: string;
  metrics: {
    impressions: SocialPillarMetric;
    engagedUsers: SocialPillarMetric;
    fans: SocialPillarMetric;
    newFans: SocialPillarMetric;
  };
}

export interface PlatformDisconnected {
  connected: false;
}

export type FacebookPlatform = FacebookPlatformConnected | PlatformDisconnected;

export interface SocialPillarDisconnected {
  connected: false;
}

export interface SocialPillarConnected {
  connected: true;
  platforms: {
    facebook: FacebookPlatform;
    instagram: PlatformDisconnected;
    linkedin: PlatformDisconnected;
  };
  reach: SocialPillarMetric;
  impressions: SocialPillarMetric;
  engagementRate: SocialPillarMetric;
}

export type SocialPillar = SocialPillarDisconnected | SocialPillarConnected;

// ===========================================
// Cache helpers
// ===========================================

function cacheKeyFor(tenantId: string) {
  return `${tenantId}:${CACHE_KEY_SUFFIX}`;
}

export async function invalidateSocialPillarCache(tenantId: string): Promise<void> {
  try {
    await pool.query(
      `DELETE FROM tenant_cache WHERE tenant_id = $1 AND cache_key = $2`,
      [tenantId, cacheKeyFor(tenantId)]
    );
    console.log(`[socialPillar] Cache invalidated for tenant ${tenantId}`);
  } catch (err) {
    console.error('[socialPillar] Cache invalidate error:', err);
  }
}

async function readCache(tenantId: string): Promise<SocialPillar | null> {
  try {
    const result = await pool.query(
      `SELECT data
       FROM tenant_cache
       WHERE tenant_id = $1 AND cache_key = $2 AND expires_at > NOW()`,
      [tenantId, cacheKeyFor(tenantId)]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].data as SocialPillar;
  } catch (err) {
    console.error('[socialPillar] cache read error:', err);
    return null;
  }
}

async function writeCache(tenantId: string, data: SocialPillar): Promise<void> {
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
    console.error('[socialPillar] cache write error:', err);
  }
}

// ===========================================
// Shape helpers
// ===========================================

function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 10) / 10;
}

function toMetric(current: number, previous: number): SocialPillarMetric {
  return {
    current: Math.round(current * 10) / 10,
    previous: Math.round(previous * 10) / 10,
    change: pctChange(current, previous),
  };
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ===========================================
// Facebook Graph API
// ===========================================

interface FbInsightsResponse {
  data?: Array<{
    name: string;
    values?: Array<{ value?: number | Record<string, number>; end_time?: string }>;
  }>;
  error?: { message?: string; code?: number; type?: string; error_subcode?: number };
}

interface AggregatedInsights {
  impressions: number; // sum
  engagedUsers: number; // sum
  fans: number; // latest daily snapshot (gauge)
  newFans: number; // sum
}

function numericValue(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object') {
    return Object.values(v as Record<string, number>).reduce(
      (sum, n) => sum + (typeof n === 'number' ? n : 0),
      0
    );
  }
  return 0;
}

/**
 * Fetch a single metric from the Page Insights API. Returns the raw daily
 * values so the caller can decide whether to sum (events) or take the last
 * snapshot (gauges). Logs and returns [] if the individual metric fails so
 * one deprecated metric doesn't poison the others.
 */
async function fetchSingleMetric(
  pageId: string,
  pageAccessToken: string,
  metric: FbMetricName,
  since: string,
  until: string,
  tag: string
): Promise<number[]> {
  const url =
    `${META_GRAPH_BASE_URL}/${pageId}/insights` +
    `?metric=${metric}` +
    `&period=day` +
    `&since=${since}` +
    `&until=${until}` +
    `&access_token=${encodeURIComponent(pageAccessToken)}`;

  // Log URL with the token masked so it can be safely grepped in Railway logs.
  const safeUrl = url.replace(/access_token=[^&]+/, 'access_token=***');
  console.log(`[socialPillar] (${tag}) GET ${safeUrl}`);

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    console.error(`[socialPillar] (${tag}) network error for ${metric}:`, err);
    return [];
  }

  const rawText = await response.text();
  if (!response.ok) {
    console.error(
      `[socialPillar] (${tag}) ${metric} HTTP ${response.status}: ${rawText.slice(0, 400)}`
    );
    return [];
  }

  let json: FbInsightsResponse;
  try {
    json = JSON.parse(rawText) as FbInsightsResponse;
  } catch (err) {
    console.error(`[socialPillar] (${tag}) ${metric} JSON parse error:`, err);
    return [];
  }

  if (json.error) {
    console.error(
      `[socialPillar] (${tag}) ${metric} API error: ${json.error.message} (code=${json.error.code}, subcode=${json.error.error_subcode})`
    );
    return [];
  }

  const entry = (json.data ?? []).find((m) => m.name === metric);
  if (!entry) {
    console.warn(`[socialPillar] (${tag}) ${metric} returned no data`);
    return [];
  }

  const values = (entry.values ?? []).map((v) => numericValue(v.value));
  console.log(
    `[socialPillar] (${tag}) ${metric} returned ${values.length} daily value(s)`
  );
  return values;
}

async function fetchWindowInsights(
  pageId: string,
  pageAccessToken: string,
  since: string,
  until: string,
  tag: string
): Promise<AggregatedInsights> {
  const [impressionsDaily, engagedDaily, fansDaily, fanAddsDaily] =
    await Promise.all(
      FB_METRICS.map((m) =>
        fetchSingleMetric(pageId, pageAccessToken, m, since, until, tag)
      )
    );

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const last = (xs: number[]) => (xs.length > 0 ? xs[xs.length - 1] : 0);

  return {
    impressions: sum(impressionsDaily),
    engagedUsers: sum(engagedDaily),
    fans: last(fansDaily), // gauge
    newFans: sum(fanAddsDaily),
  };
}

// ===========================================
// Main entry point
// ===========================================

export async function getSocialPillar(tenantId: string): Promise<SocialPillar> {
  console.log(`[socialPillar] Fetching for tenant ${tenantId}`);

  // 1. Cache — only trust cached CONNECTED results. A cached disconnected
  // result is re-evaluated so that selecting a page takes effect immediately,
  // even if cache invalidation got missed somewhere.
  const cached = await readCache(tenantId);
  if (cached && cached.connected === true) {
    console.log(`[socialPillar] Cache HIT (connected) for tenant ${tenantId}`);
    return cached;
  }
  if (cached) {
    console.log(
      `[socialPillar] Cache has disconnected entry for tenant ${tenantId} — re-evaluating`
    );
  } else {
    console.log(`[socialPillar] Cache MISS for tenant ${tenantId}`);
  }

  const disconnected: SocialPillar = { connected: false };

  // 2. Look up Meta connection + selected Facebook page
  let pageId: string | null = null;
  let pageAccessToken: string | null = null;
  let pageName = '';
  try {
    const result = await pool.query(
      `SELECT selected_facebook_page_id,
              selected_facebook_page_name,
              selected_facebook_page_access_token
       FROM tenant_connections
       WHERE tenant_id = $1 AND platform = 'meta'`,
      [tenantId]
    );
    if (result.rows.length === 0) {
      console.log(
        `[socialPillar] No Meta connection row for tenant ${tenantId} — returning disconnected`
      );
      return disconnected;
    }
    const row = result.rows[0];
    pageId = row.selected_facebook_page_id ?? null;
    pageAccessToken = row.selected_facebook_page_access_token ?? null;
    pageName = row.selected_facebook_page_name ?? '';
  } catch (err) {
    console.error('[socialPillar] DB lookup error:', err);
    return disconnected;
  }

  if (!pageId || !pageAccessToken) {
    console.log(
      `[socialPillar] Meta connection exists but no page selected for tenant ${tenantId} (pageId=${pageId ? 'set' : 'null'}, pageAccessToken=${pageAccessToken ? 'set' : 'null'}) — returning disconnected`
    );
    return disconnected;
  }

  console.log(
    `[socialPillar] Fetching for tenant ${tenantId} page ${pageId} (${pageName})`
  );

  // 3. Build date windows: last 7 days, and the 7 days before that
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  const currentSince = ymd(sevenDaysAgo);
  const currentUntil = ymd(today);
  const previousSince = ymd(fourteenDaysAgo);
  const previousUntil = ymd(sevenDaysAgo);

  // 4. Fetch current + previous windows in parallel. Individual metric
  // failures are tolerated (see fetchSingleMetric), so we always reach the
  // connected=true path as long as the page was selected.
  const [current, previous] = await Promise.all([
    fetchWindowInsights(pageId, pageAccessToken, currentSince, currentUntil, 'current'),
    fetchWindowInsights(pageId, pageAccessToken, previousSince, previousUntil, 'previous'),
  ]);

  console.log(
    `[socialPillar] Aggregated for tenant ${tenantId}: current=${JSON.stringify(current)} previous=${JSON.stringify(previous)}`
  );

  // 5. Build pillar payload
  const impressions = toMetric(current.impressions, previous.impressions);
  const engagedUsers = toMetric(current.engagedUsers, previous.engagedUsers);
  const fans = toMetric(current.fans, previous.fans);
  const newFans = toMetric(current.newFans, previous.newFans);

  const currentEngagementRate =
    current.impressions > 0
      ? (current.engagedUsers / current.impressions) * 100
      : 0;
  const previousEngagementRate =
    previous.impressions > 0
      ? (previous.engagedUsers / previous.impressions) * 100
      : 0;

  // No dedicated reach metric is fetched (task spec lists only the four
  // above) — use impressions as a proxy for combined reach until Instagram /
  // LinkedIn are wired in.
  const reach = toMetric(current.impressions, previous.impressions);
  const engagementRate = toMetric(currentEngagementRate, previousEngagementRate);

  const result: SocialPillarConnected = {
    connected: true,
    platforms: {
      facebook: {
        connected: true,
        pageName,
        metrics: { impressions, engagedUsers, fans, newFans },
      },
      instagram: { connected: false },
      linkedin: { connected: false },
    },
    reach,
    impressions,
    engagementRate,
  };

  await writeCache(tenantId, result);
  console.log(
    `[socialPillar] Returning connected pillar for tenant ${tenantId} (cached 1h)`
  );
  return result;
}
