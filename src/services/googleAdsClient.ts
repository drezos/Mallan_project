import { getValidAccessToken } from './tokenManager';

// TODO: Obtain a Google Ads developer token from https://developers.google.com/google-ads/api/docs/first-call/dev-token
// and set it as the GOOGLE_ADS_DEVELOPER_TOKEN environment variable.
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

const GOOGLE_ADS_API_VERSION = 'v19';
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export interface GoogleAdsMetrics {
  spend: number;
  cpa: number;
  roas: number;
  conversions: number;
  ctr: number;
  clicks: number;
  impressions: number;
}

const ZERO_METRICS: GoogleAdsMetrics = {
  spend: 0,
  cpa: 0,
  roas: 0,
  conversions: 0,
  ctr: 0,
  clicks: 0,
  impressions: 0,
};

const GAQL_QUERY = `
  SELECT
    metrics.cost_micros,
    metrics.conversions,
    metrics.conversions_value,
    metrics.clicks,
    metrics.impressions,
    metrics.ctr
  FROM campaign
  WHERE segments.date DURING LAST_7_DAYS
    AND campaign.status = 'ENABLED'
`.trim();

export async function getGoogleAdsMetrics(tenantId: string): Promise<GoogleAdsMetrics> {
  if (!DEVELOPER_TOKEN) {
    console.warn(`[googleAdsClient] GOOGLE_ADS_DEVELOPER_TOKEN is not set — returning zeros for tenant ${tenantId}`);
    return ZERO_METRICS;
  }

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (!customerId) {
    console.warn(`[googleAdsClient] GOOGLE_ADS_CUSTOMER_ID is not set — returning zeros for tenant ${tenantId}`);
    return ZERO_METRICS;
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(tenantId, 'google');
  } catch (err) {
    console.error(`[googleAdsClient] Failed to get access token for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  try {
    const response = await fetch(
      `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': DEVELOPER_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: GAQL_QUERY }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[googleAdsClient] Google Ads API error for tenant ${tenantId}: ${response.status} ${error}`);
      return ZERO_METRICS;
    }

    const data = await response.json() as GoogleAdsSearchStreamResponse[];

    if (!data || data.length === 0) {
      return ZERO_METRICS;
    }

    let totalCostMicros = 0;
    let totalConversions = 0;
    let totalConversionsValue = 0;
    let totalClicks = 0;
    let totalImpressions = 0;

    for (const batch of data) {
      for (const result of batch.results ?? []) {
        const metrics = result.metrics;
        if (!metrics) continue;
        totalCostMicros += parseFloat(metrics.costMicros ?? '0');
        totalConversions += parseFloat(metrics.conversions ?? '0');
        totalConversionsValue += parseFloat(metrics.conversionsValue ?? '0');
        totalClicks += parseFloat(metrics.clicks ?? '0');
        totalImpressions += parseFloat(metrics.impressions ?? '0');
      }
    }

    const spend = totalCostMicros / 1_000_000;
    const conversions = totalConversions;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const roas = spend > 0 ? totalConversionsValue / spend : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      spend,
      cpa,
      roas,
      conversions,
      ctr,
      clicks: totalClicks,
      impressions: totalImpressions,
    };
  } catch (err) {
    console.error(`[googleAdsClient] Unexpected error fetching Google Ads data for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }
}

// Internal types for Google Ads searchStream response
interface GoogleAdsSearchStreamResponse {
  results?: Array<{
    metrics?: {
      costMicros?: string;
      conversions?: string;
      conversionsValue?: string;
      clicks?: string;
      impressions?: string;
      ctr?: string;
    };
  }>;
}
