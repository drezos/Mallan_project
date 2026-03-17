import { getValidAccessToken } from './tokenManager';

const META_API_VERSION = 'v19.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaAdsMetrics {
  spend: number;
  cpa: number;
  roas: number;
  conversions: number;
  ctr: number;
  clicks: number;
  impressions: number;
}

const ZERO_METRICS: MetaAdsMetrics = {
  spend: 0,
  cpa: 0,
  roas: 0,
  conversions: 0,
  ctr: 0,
  clicks: 0,
  impressions: 0,
};

const INSIGHTS_FIELDS = 'spend,impressions,clicks,actions,ctr,cpc';

export async function getMetaAdsMetrics(tenantId: string): Promise<MetaAdsMetrics> {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(tenantId, 'meta');
  } catch (err) {
    console.error(`[metaAdsClient] Failed to get access token for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  // Step 1: Get ad account IDs
  let adAccountIds: string[];
  try {
    const response = await fetch(
      `${META_GRAPH_BASE_URL}/me/adaccounts?fields=id&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[metaAdsClient] Failed to fetch ad accounts for tenant ${tenantId}: ${response.status} ${error}`);
      return ZERO_METRICS;
    }

    const data = await response.json() as MetaAdAccountsResponse;
    adAccountIds = (data.data ?? []).map((account) => account.id);
  } catch (err) {
    console.error(`[metaAdsClient] Unexpected error fetching ad accounts for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  if (adAccountIds.length === 0) {
    return ZERO_METRICS;
  }

  // Step 2: Fetch insights for each ad account (last 7 days)
  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalConversionsValue = 0;

  for (const adAccountId of adAccountIds) {
    try {
      const response = await fetch(
        `${META_GRAPH_BASE_URL}/${adAccountId}/insights` +
          `?fields=${INSIGHTS_FIELDS}` +
          `&date_preset=last_7d` +
          `&access_token=${accessToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`[metaAdsClient] Insights error for account ${adAccountId} (tenant ${tenantId}): ${response.status} ${error}`);
        continue;
      }

      const data = await response.json() as MetaInsightsResponse;

      for (const insight of data.data ?? []) {
        totalSpend += parseFloat(insight.spend ?? '0');
        totalImpressions += parseFloat(insight.impressions ?? '0');
        totalClicks += parseFloat(insight.clicks ?? '0');

        for (const action of insight.actions ?? []) {
          if (action.action_type === 'purchase') {
            totalConversions += parseFloat(action.value ?? '0');
          }
          if (action.action_type === 'offsite_conversion.fb_pixel_purchase') {
            totalConversionsValue += parseFloat(action.value ?? '0');
          }
        }
      }
    } catch (err) {
      console.error(`[metaAdsClient] Unexpected error fetching insights for account ${adAccountId} (tenant ${tenantId}):`, err);
    }
  }

  const spend = totalSpend;
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
}

// Internal types for Meta Graph API responses
interface MetaAdAccountsResponse {
  data?: Array<{ id: string }>;
}

interface MetaInsightsResponse {
  data?: Array<{
    spend?: string;
    impressions?: string;
    clicks?: string;
    ctr?: string;
    cpc?: string;
    actions?: Array<{
      action_type: string;
      value?: string;
    }>;
  }>;
}
