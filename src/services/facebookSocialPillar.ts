import { pool } from '../db/cache';

const META_API_VERSION = 'v21.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

const CACHE_KEY_SUFFIX = 'dashboard:social';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

const FB_INSIGHTS_METRICS =
  'page_impressions,page_post_engagements,page_fans,page_fan_adds';

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
// Helpers
// ===========================================

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
    console.error('[facebookSocialPillar] cache read error:', err);
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
    console.error('[facebookSocialPillar] cache write error:', err);
  }
}

// ===========================================
// Facebook Graph API
// ===========================================

interface FbInsightsResponse {
  data?: Array<{
    name: string;
    values?: Array<{ value?: number | Record<string, number>; end_time?: string }>;
  }>;
  error?: { message?: string; code?: number };
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
    // Some insights return an object map (e.g. by age/gender) — sum its values.
    return Object.values(v as Record<string, number>).reduce(
      (sum, n) => sum + (typeof n === 'number' ? n : 0),
      0
    );
  }
  return 0;
}

function aggregateInsights(resp: FbInsightsResponse): AggregatedInsights {
  let impressions = 0;
  let engagedUsers = 0;
  let fans = 0;
  let newFans = 0;

  for (const metric of resp.data ?? []) {
    const values = metric.values ?? [];
    if (metric.name === 'page_impressions') {
      impressions = values.reduce((sum, v) => sum + numericValue(v.value), 0);
    } else if (metric.name === 'page_post_engagements') {
      engagedUsers = values.reduce((sum, v) => sum + numericValue(v.value), 0);
    } else if (metric.name === 'page_fans') {
      // Gauge: use the most recent daily snapshot
      fans = values.length > 0 ? numericValue(values[values.length - 1].value) : 0;
    } else if (metric.name === 'page_fan_adds') {
      newFans = values.reduce((sum, v) => sum + numericValue(v.value), 0);
    }
  }

  return { impressions, engagedUsers, fans, newFans };
}

async function fetchPageInsights(
  pageId: string,
  pageAccessToken: string,
  since: string,
  until: string
): Promise<AggregatedInsights> {
  const url =
    `${META_GRAPH_BASE_URL}/${pageId}/insights` +
    `?metric=${FB_INSIGHTS_METRICS}` +
    `&period=day` +
    `&since=${since}` +
    `&until=${until}` +
    `&access_token=${encodeURIComponent(pageAccessToken)}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Facebook Page Insights call failed (${response.status}): ${errorText}`
    );
  }
  const json = (await response.json()) as FbInsightsResponse;
  if (json.error) {
    throw new Error(
      `Facebook Page Insights returned error: ${json.error.message ?? 'unknown'}`
    );
  }
  return aggregateInsights(json);
}

// ===========================================
// Main entry point
// ===========================================

export async function getSocialPillar(tenantId: string): Promise<SocialPillar> {
  // 1. Cache
  const cached = await readCache(tenantId);
  if (cached) return cached;

  const disconnected: SocialPillar = { connected: false };

  // 2. Look up Meta connection and selected Facebook page
  let connRow: {
    selected_facebook_page_id?: string | null;
    selected_facebook_page_name?: string | null;
    selected_facebook_page_access_token?: string | null;
  };
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
      await writeCache(tenantId, disconnected);
      return disconnected;
    }
    connRow = result.rows[0];
  } catch (err) {
    console.error('[facebookSocialPillar] DB lookup error:', err);
    return disconnected;
  }

  const pageId = connRow.selected_facebook_page_id;
  const pageAccessToken = connRow.selected_facebook_page_access_token;
  const pageName = connRow.selected_facebook_page_name ?? '';

  if (!pageId || !pageAccessToken) {
    await writeCache(tenantId, disconnected);
    return disconnected;
  }

  // 3. Build date windows: last 7 days, and the 7 days before that
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  const currentSince = ymd(sevenDaysAgo);
  const currentUntil = ymd(today);
  const previousSince = ymd(fourteenDaysAgo);
  const previousUntil = ymd(sevenDaysAgo);

  // 4. Fetch current + previous windows in parallel
  let current: AggregatedInsights;
  let previous: AggregatedInsights;
  try {
    [current, previous] = await Promise.all([
      fetchPageInsights(pageId, pageAccessToken, currentSince, currentUntil),
      fetchPageInsights(pageId, pageAccessToken, previousSince, previousUntil),
    ]);
  } catch (err) {
    console.error(
      `[facebookSocialPillar] Facebook Page Insights error for tenant ${tenantId}:`,
      err
    );
    // If the API call fails we surface disconnected rather than throw, so the
    // rest of the dashboard still renders.
    return disconnected;
  }

  // 5. Build pillar payload
  const impressions = toMetric(current.impressions, previous.impressions);
  const engagedUsers = toMetric(current.engagedUsers, previous.engagedUsers);
  const fans = toMetric(current.fans, previous.fans);
  const newFans = toMetric(current.newFans, previous.newFans);

  // Engagement rate = engaged_users / impressions * 100
  const currentEngagementRate =
    current.impressions > 0
      ? (current.engagedUsers / current.impressions) * 100
      : 0;
  const previousEngagementRate =
    previous.impressions > 0
      ? (previous.engagedUsers / previous.impressions) * 100
      : 0;

  // No dedicated reach metric is fetched — use impressions as a proxy so the
  // combined totals still have a value. Instagram / LinkedIn will supply real
  // reach when they come online.
  const reach = toMetric(current.impressions, previous.impressions);
  const engagementRate = toMetric(currentEngagementRate, previousEngagementRate);

  const result: SocialPillarConnected = {
    connected: true,
    platforms: {
      facebook: {
        connected: true,
        pageName,
        metrics: {
          impressions,
          engagedUsers,
          fans,
          newFans,
        },
      },
      instagram: { connected: false },
      linkedin: { connected: false },
    },
    reach,
    impressions,
    engagementRate,
  };

  await writeCache(tenantId, result);
  return result;
}
