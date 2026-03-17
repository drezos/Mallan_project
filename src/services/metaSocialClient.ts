import { getValidAccessToken } from './tokenManager';

const META_API_VERSION = 'v19.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaSocialMetrics {
  reach: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
  platforms: Record<string, unknown>;
}

const ZERO_METRICS: MetaSocialMetrics = {
  reach: 0,
  impressions: 0,
  engagementRate: 0,
  followerGrowth: 0,
  platforms: {},
};

export async function getMetaSocialMetrics(tenantId: string): Promise<MetaSocialMetrics> {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(tenantId, 'meta');
  } catch (err) {
    console.error(`[metaSocialClient] Failed to get access token for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  // Step 1: Get pages managed by the user
  let pages: Array<{ id: string; name: string; access_token: string }>;
  try {
    const response = await fetch(
      `${META_GRAPH_BASE_URL}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
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

  // Step 2: Fetch insights for each page (last 7 days)
  let totalReach = 0;
  let totalImpressions = 0;
  let totalEngagedUsers = 0;
  let totalFollowerGrowth = 0;
  const platforms: Record<string, unknown> = {};

  for (const page of pages) {
    const pageToken = page.access_token;
    try {
      const insightMetrics = 'page_impressions,page_reach,page_engaged_users,page_fan_adds_unique';
      const response = await fetch(
        `${META_GRAPH_BASE_URL}/${page.id}/insights` +
          `?metric=${insightMetrics}` +
          `&period=week` +
          `&access_token=${pageToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`[metaSocialClient] Insights error for page ${page.id} (tenant ${tenantId}): ${response.status} ${error}`);
        continue;
      }

      const data = await response.json() as MetaPageInsightsResponse;

      let pageReach = 0;
      let pageImpressions = 0;
      let pageEngagedUsers = 0;
      let pageFollowerGrowth = 0;

      for (const metric of data.data ?? []) {
        const latestValue = metric.values?.[metric.values.length - 1]?.value ?? 0;
        const val = typeof latestValue === 'number' ? latestValue : 0;
        switch (metric.name) {
          case 'page_reach':
            pageReach = val;
            break;
          case 'page_impressions':
            pageImpressions = val;
            break;
          case 'page_engaged_users':
            pageEngagedUsers = val;
            break;
          case 'page_fan_adds_unique':
            pageFollowerGrowth = val;
            break;
        }
      }

      totalReach += pageReach;
      totalImpressions += pageImpressions;
      totalEngagedUsers += pageEngagedUsers;
      totalFollowerGrowth += pageFollowerGrowth;

      platforms[page.name] = {
        pageId: page.id,
        reach: pageReach,
        impressions: pageImpressions,
        engagedUsers: pageEngagedUsers,
        followerGrowth: pageFollowerGrowth,
      };
    } catch (err) {
      console.error(`[metaSocialClient] Unexpected error fetching insights for page ${page.id} (tenant ${tenantId}):`, err);
    }
  }

  const engagementRate = totalReach > 0 ? (totalEngagedUsers / totalReach) * 100 : 0;

  return {
    reach: totalReach,
    impressions: totalImpressions,
    engagementRate,
    followerGrowth: totalFollowerGrowth,
    platforms,
  };
}

// Internal types for Meta Graph API responses
interface MetaPagesResponse {
  data?: Array<{ id: string; name: string; access_token: string }>;
}

interface MetaPageInsightsResponse {
  data?: Array<{
    name: string;
    values?: Array<{ value: number | Record<string, number>; end_time: string }>;
  }>;
}
