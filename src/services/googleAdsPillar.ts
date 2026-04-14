import { GoogleAdsApi } from 'google-ads-api';
import { pool } from '../db/cache';

const CACHE_KEY_SUFFIX = 'dashboard:ads:google';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface GoogleAdsMetric {
  current: number;
  previous: number;
  change: number;
}

export interface GoogleAdsPillarDisconnected {
  connected: false;
  spend: number;
  cpa: number;
  roas: number;
  conversions: number;
  ctr: number;
  clicks: number;
  impressions: number;
}

export interface GoogleAdsPillarConnected {
  connected: true;
  accountName: string;
  currencyCode: string;
  spend: GoogleAdsMetric;
  conversions: GoogleAdsMetric;
  cpa: GoogleAdsMetric;
  roas: GoogleAdsMetric;
  ctr: GoogleAdsMetric;
  clicks: GoogleAdsMetric;
  impressions: GoogleAdsMetric;
}

export type GoogleAdsPillar =
  | GoogleAdsPillarDisconnected
  | GoogleAdsPillarConnected;

const ZERO_DISCONNECTED: GoogleAdsPillarDisconnected = {
  connected: false,
  spend: 0,
  cpa: 0,
  roas: 0,
  conversions: 0,
  ctr: 0,
  clicks: 0,
  impressions: 0,
};

function cacheKeyFor(tenantId: string) {
  return `${tenantId}:${CACHE_KEY_SUFFIX}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function toMetric(current: number, previous: number): GoogleAdsMetric {
  return {
    current: round2(current),
    previous: round2(previous),
    change: pctChange(current, previous),
  };
}

async function readCache(tenantId: string): Promise<GoogleAdsPillar | null> {
  try {
    const result = await pool.query(
      `SELECT data
       FROM tenant_cache
       WHERE tenant_id = $1 AND cache_key = $2 AND expires_at > NOW()`,
      [tenantId, cacheKeyFor(tenantId)]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].data as GoogleAdsPillar;
  } catch (err) {
    console.error('[googleAdsPillar] cache read error:', err);
    return null;
  }
}

async function writeCache(tenantId: string, data: GoogleAdsPillar): Promise<void> {
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
    console.error('[googleAdsPillar] cache write error:', err);
  }
}

function formatDate(d: Date): string {
  // YYYY-MM-DD in UTC
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateRanges(): {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
} {
  const now = new Date();
  const mk = (daysAgo: number) => {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    d.setUTCDate(d.getUTCDate() - daysAgo);
    return d;
  };
  return {
    currentStart: formatDate(mk(7)),
    currentEnd: formatDate(mk(1)),
    previousStart: formatDate(mk(14)),
    previousEnd: formatDate(mk(8)),
  };
}

interface AggregatedMetrics {
  spend: number;
  conversions: number;
  conversionsValue: number;
  clicks: number;
  impressions: number;
}

async function runGaqlQuery(
  customer: any,
  startDate: string,
  endDate: string,
  rangeLabel: 'current' | 'previous'
): Promise<AggregatedMetrics> {
  const query = `
    SELECT
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr
    FROM customer
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
  `.trim();

  console.log(
    `[googleAdsPillar] running ${rangeLabel} GAQL query ${startDate}..${endDate}:`,
    query.replace(/\s+/g, ' ')
  );

  const rows: any[] = await customer.query(query);

  console.log(
    `[googleAdsPillar] ${rangeLabel} query returned ${rows?.length ?? 0} rows`
  );

  let costMicros = 0;
  let conversions = 0;
  let conversionsValue = 0;
  let clicks = 0;
  let impressions = 0;

  for (const row of rows ?? []) {
    const m = row?.metrics ?? {};
    costMicros += Number(m.cost_micros ?? 0);
    conversions += Number(m.conversions ?? 0);
    conversionsValue += Number(m.conversions_value ?? 0);
    clicks += Number(m.clicks ?? 0);
    impressions += Number(m.impressions ?? 0);
  }

  return {
    spend: costMicros / 1_000_000,
    conversions,
    conversionsValue,
    clicks,
    impressions,
  };
}

function deriveRates(agg: AggregatedMetrics) {
  const ctr =
    agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0;
  const roas = agg.spend > 0 ? agg.conversionsValue / agg.spend : 0;
  const cpa = agg.conversions > 0 ? agg.spend / agg.conversions : 0;
  return { ctr, roas, cpa };
}

export async function getGoogleAdsPillar(
  tenantId: string
): Promise<GoogleAdsPillar> {
  console.log('[googleAdsPillar] entry', { tenantId });

  // 1. Try cache first
  const cached = await readCache(tenantId);
  if (cached) {
    console.log('[googleAdsPillar] cache hit for tenant', tenantId);
    return cached;
  }

  // 2. Look up Google connection + selected Ads customer for this tenant
  const connResult = await pool.query(
    `SELECT refresh_token,
            selected_google_ads_customer_id,
            selected_google_ads_account_name,
            selected_google_ads_currency_code
     FROM tenant_connections
     WHERE tenant_id = $1 AND platform = 'google'`,
    [tenantId]
  );

  if (
    connResult.rows.length === 0 ||
    !connResult.rows[0].refresh_token ||
    !connResult.rows[0].selected_google_ads_customer_id
  ) {
    console.log(
      '[googleAdsPillar] no Google connection or no selected customer for tenant',
      tenantId
    );
    await writeCache(tenantId, ZERO_DISCONNECTED);
    return ZERO_DISCONNECTED;
  }

  const {
    refresh_token,
    selected_google_ads_customer_id: customerId,
    selected_google_ads_account_name: accountName,
    selected_google_ads_currency_code: currencyCode,
  } = connResult.rows[0];

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!clientId || !clientSecret || !developerToken) {
    console.warn(
      '[googleAdsPillar] missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_ADS_DEVELOPER_TOKEN — returning zeros for tenant',
      tenantId
    );
    await writeCache(tenantId, ZERO_DISCONNECTED);
    return ZERO_DISCONNECTED;
  }

  const client = new GoogleAdsApi({
    client_id: clientId,
    client_secret: clientSecret,
    developer_token: developerToken,
  });

  // Use the selected customerId itself as login_customer_id (same fix pattern
  // as the accounts endpoint when the user has direct access to the account).
  const customer = client.Customer({
    customer_id: customerId,
    login_customer_id: customerId,
    refresh_token,
  });

  const { currentStart, currentEnd, previousStart, previousEnd } = dateRanges();

  console.log('[googleAdsPillar] date ranges', {
    tenantId,
    customerId,
    current: `${currentStart}..${currentEnd}`,
    previous: `${previousStart}..${previousEnd}`,
  });

  let currentAgg: AggregatedMetrics;
  let previousAgg: AggregatedMetrics;
  try {
    [currentAgg, previousAgg] = await Promise.all([
      runGaqlQuery(customer, currentStart, currentEnd, 'current'),
      runGaqlQuery(customer, previousStart, previousEnd, 'previous'),
    ]);
  } catch (err: any) {
    const msg =
      err?.errors?.[0]?.message ||
      err?.message ||
      'Unknown Google Ads error';
    console.error(
      '[googleAdsPillar] GAQL query failed for tenant',
      tenantId,
      'customer',
      customerId,
      ':',
      msg
    );
    // Don't cache a hard error — let the next request retry.
    return ZERO_DISCONNECTED;
  }

  const cur = deriveRates(currentAgg);
  const prev = deriveRates(previousAgg);

  const result: GoogleAdsPillarConnected = {
    connected: true,
    accountName: accountName ?? '',
    currencyCode: currencyCode ?? '',
    spend: toMetric(currentAgg.spend, previousAgg.spend),
    conversions: toMetric(currentAgg.conversions, previousAgg.conversions),
    cpa: toMetric(cur.cpa, prev.cpa),
    roas: toMetric(cur.roas, prev.roas),
    ctr: toMetric(cur.ctr, prev.ctr),
    clicks: toMetric(currentAgg.clicks, previousAgg.clicks),
    impressions: toMetric(currentAgg.impressions, previousAgg.impressions),
  };

  console.log('[googleAdsPillar] final aggregated values for tenant', tenantId, {
    customerId,
    accountName: result.accountName,
    currencyCode: result.currencyCode,
    spend: result.spend,
    conversions: result.conversions,
    cpa: result.cpa,
    roas: result.roas,
    ctr: result.ctr,
    clicks: result.clicks,
    impressions: result.impressions,
  });

  await writeCache(tenantId, result);
  return result;
}
