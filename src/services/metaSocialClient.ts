import { getValidAccessToken } from './tokenManager';

const META_API_VERSION = 'v19.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaSocialMetrics {
  reach: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
  platforms: {
    facebook: {
      impressions: number;
      engagedUsers: number;
      fans: number;
    };
    instagram: {
      impressions: number;
      reach: number;
      followerCount: number;
    };
  };
}

const ZERO_METRICS: MetaSocialMetrics = {
  reach: 0,
  impressions: 0,
  engagementRate: 0,
  followerGrowth: 0,
  platforms: {
    facebook: {
      impressions: 0,
      engagedUsers: 0,
      fans: 0,
    },
    instagram: {
      impressions: 0,
      reach: 0,
      followerCount: 0,
    },
  },
};

const PAGE_INSIGHTS_FIELDS = 'page_impressions,page_engaged_users,page_fans';
const INSTAGRAM_INSIGHTS_FIELDS = 'impressions,reach,follower_count';

export async function getMetaSocialMetrics(tenantId: string): Promise<MetaSocialMetrics> {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(tenantId, 'meta');
  } catch (err) {
    console.error(`[metaSocialClient] Failed to get access token for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  // Step 1: Get Facebook Pages
  let pages: MetaPage[];
  try {
    const response = await fetch(
      `${META_GRAPH_BASE_URL}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[metaSocialClient] Failed to fetch pages for tenant ${tenantId}: ${response.status} ${error}`);
      return ZERO_METRICS;
    }

    const data = await response.json() as MetaPagesResponse;
    pages = data.data ?? [];
  } catch (err) {
    console.error(`[metaSocialClient] Unexpected error fetching pages for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  if (pages.length === 0) {
    return ZERO_METRICS;
  }

  // Step 2: Fetch insights for each page (and connected Instagram account)
  let fbImpressions = 0;
  let fbEngagedUsers = 0;
  let fbFans = 0;
  let igImpressions = 0;
  let igReach = 0;
  let igFollowerCount = 0;

  for (const page of pages) {
    // Facebook Page insights
    try {
      const response = await fetch(
        `${META_GRAPH_BASE_URL}/${page.id}/insights` +
          `?metric=${PAGE_INSIGHTS_FIELDS}` +
          `&period=day` +
          `&date_preset=last_7d` +
          `&access_token=${accessToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`[metaSocialClient] Page insights error for page ${page.id} (tenant ${tenantId}): ${response.status} ${error}`);
      } else {
        const data = await response.json() as MetaPageInsightsResponse;
        for (const metric of data.data ?? []) {
          const total = sumInsightValues(metric.values ?? []);
          if (metric.name === 'page_impressions') fbImpressions += total;
          if (metric.name === 'page_engaged_users') fbEngagedUsers += total;
          if (metric.name === 'page_fans') fbFans += total;
        }
      }
    } catch (err) {
      console.error(`[metaSocialClient] Unexpected error fetching page insights for page ${page.id} (tenant ${tenantId}):`, err);
    }

    // Instagram Business Account insights (if connected)
    const igAccountId = page.instagram_business_account?.id;
    if (igAccountId) {
      try {
        const response = await fetch(
          `${META_GRAPH_BASE_URL}/${igAccountId}/insights` +
            `?metric=${INSTAGRAM_INSIGHTS_FIELDS}` +
            `&period=day` +
            `&date_preset=last_7d` +
            `&access_token=${accessToken}`
        );

        if (!response.ok) {
          const error = await response.text();
          console.error(`[metaSocialClient] Instagram insights error for account ${igAccountId} (tenant ${tenantId}): ${response.status} ${error}`);
        } else {
          const data = await response.json() as MetaPageInsightsResponse;
          for (const metric of data.data ?? []) {
            const total = sumInsightValues(metric.values ?? []);
            if (metric.name === 'impressions') igImpressions += total;
            if (metric.name === 'reach') igReach += total;
            if (metric.name === 'follower_count') igFollowerCount += total;
          }
        }
      } catch (err) {
        console.error(`[metaSocialClient] Unexpected error fetching Instagram insights for account ${igAccountId} (tenant ${tenantId}):`, err);
      }
    }
  }

  const totalImpressions = fbImpressions + igImpressions;
  const totalReach = igReach + fbFans; // fans as a proxy for FB reach baseline
  const totalFollowers = fbFans + igFollowerCount;
  const engagementRate = totalFollowers > 0 ? (fbEngagedUsers / totalFollowers) * 100 : 0;

  return {
    reach: totalReach,
    impressions: totalImpressions,
    engagementRate,
    followerGrowth: totalFollowers,
    platforms: {
      facebook: {
        impressions: fbImpressions,
        engagedUsers: fbEngagedUsers,
        fans: fbFans,
      },
      instagram: {
        impressions: igImpressions,
        reach: igReach,
        followerCount: igFollowerCount,
      },
    },
  };
}

function sumInsightValues(values: Array<{ value?: number }>): number {
  return values.reduce((sum, v) => sum + (v.value ?? 0), 0);
}

// Internal types for Meta Graph API responses
interface MetaPage {
  id: string;
  name?: string;
  instagram_business_account?: { id: string };
}

interface MetaPagesResponse {
  data?: MetaPage[];
}

interface MetaPageInsightsResponse {
  data?: Array<{
    name: string;
    values?: Array<{ value?: number; end_time?: string }>;
  }>;
}
