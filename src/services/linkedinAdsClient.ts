import { getValidAccessToken } from './tokenManager';

const LINKEDIN_API_BASE_URL = 'https://api.linkedin.com/v2';
const LINKEDIN_API_VERSION = '202501';

export interface LinkedInAdsMetrics {
  spend: number;
  cpa: number;
  roas: number;
  conversions: number;
  ctr: number;
  clicks: number;
  impressions: number;
}

const ZERO_METRICS: LinkedInAdsMetrics = {
  spend: 0,
  cpa: 0,
  roas: 0,
  conversions: 0,
  ctr: 0,
  clicks: 0,
  impressions: 0,
};

export async function getLinkedInAdsMetrics(tenantId: string): Promise<LinkedInAdsMetrics> {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(tenantId, 'linkedin');
  } catch (err) {
    console.error(`[linkedinAdsClient] Failed to get access token for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  // Step 1: Get ad account IDs
  let adAccountIds: string[];
  try {
    const response = await fetch(
      `${LINKEDIN_API_BASE_URL}/adAccountsV2?q=search&search.type.values[0]=BUSINESS`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[linkedinAdsClient] Failed to fetch ad accounts for tenant ${tenantId}: ${response.status} ${error}`);
      return ZERO_METRICS;
    }

    const data = await response.json() as LinkedInAdAccountsResponse;
    adAccountIds = (data.elements ?? []).map((account) => String(account.id));
  } catch (err) {
    console.error(`[linkedinAdsClient] Unexpected error fetching ad accounts for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  if (adAccountIds.length === 0) {
    return ZERO_METRICS;
  }

  // Step 2: Fetch campaign analytics for each ad account (last 7 days)
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalConversionsValue = 0;

  for (const adAccountId of adAccountIds) {
    try {
      const params = new URLSearchParams({
        q: 'analytics',
        pivot: 'ACCOUNT',
        timeGranularity: 'ALL',
        'accounts[0]': `urn:li:sponsoredAccount:${adAccountId}`,
        'dateRange.start.year': String(start.getFullYear()),
        'dateRange.start.month': String(start.getMonth() + 1),
        'dateRange.start.day': String(start.getDate()),
        'dateRange.end.year': String(end.getFullYear()),
        'dateRange.end.month': String(end.getMonth() + 1),
        'dateRange.end.day': String(end.getDate()),
        fields: 'costInLocalCurrency,impressions,clicks,externalWebsiteConversions,conversionValueInLocalCurrency',
      });

      const response = await fetch(
        `${LINKEDIN_API_BASE_URL}/adAnalyticsV2?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'LinkedIn-Version': LINKEDIN_API_VERSION,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`[linkedinAdsClient] Analytics error for account ${adAccountId} (tenant ${tenantId}): ${response.status} ${error}`);
        continue;
      }

      const data = await response.json() as LinkedInAnalyticsResponse;

      for (const element of data.elements ?? []) {
        totalSpend += parseFloat(element.costInLocalCurrency ?? '0');
        totalImpressions += element.impressions ?? 0;
        totalClicks += element.clicks ?? 0;
        totalConversions += element.externalWebsiteConversions ?? 0;
        totalConversionsValue += parseFloat(element.conversionValueInLocalCurrency ?? '0');
      }
    } catch (err) {
      console.error(`[linkedinAdsClient] Unexpected error fetching analytics for account ${adAccountId} (tenant ${tenantId}):`, err);
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

// Internal types for LinkedIn Marketing API responses
interface LinkedInAdAccountsResponse {
  elements?: Array<{ id: number }>;
}

interface LinkedInAnalyticsResponse {
  elements?: Array<{
    costInLocalCurrency?: string;
    impressions?: number;
    clicks?: number;
    externalWebsiteConversions?: number;
    conversionValueInLocalCurrency?: string;
  }>;
}
