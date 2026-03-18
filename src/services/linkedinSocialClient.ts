import { getValidAccessToken } from './tokenManager';

const LINKEDIN_API_BASE_URL = 'https://api.linkedin.com/v2';

export interface LinkedInSocialMetrics {
  impressions: number;
  reach: number;
  engagementRate: number;
  followerCount: number;
}

const ZERO_METRICS: LinkedInSocialMetrics = {
  impressions: 0,
  reach: 0,
  engagementRate: 0,
  followerCount: 0,
};

export async function getLinkedInSocialMetrics(tenantId: string): Promise<LinkedInSocialMetrics> {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(tenantId, 'linkedin');
  } catch (err) {
    console.error(`[linkedinSocialClient] Failed to get access token for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  // Step 1: Get the organization URN for this account
  let organizationId: string;
  try {
    const response = await fetch(
      `${LINKEDIN_API_BASE_URL}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(id)))`,
      { headers: { Authorization: `Bearer ${accessToken}`, 'LinkedIn-Version': '202304' } }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[linkedinSocialClient] Failed to fetch organization for tenant ${tenantId}: ${response.status} ${error}`);
      return ZERO_METRICS;
    }

    const data = await response.json() as LinkedInAclResponse;
    const firstElement = data.elements?.[0];
    const orgTarget = firstElement?.['organizationalTarget~'];
    if (!orgTarget?.id) {
      console.error(`[linkedinSocialClient] No organization found for tenant ${tenantId}`);
      return ZERO_METRICS;
    }
    organizationId = String(orgTarget.id);
  } catch (err) {
    console.error(`[linkedinSocialClient] Unexpected error fetching organization for tenant ${tenantId}:`, err);
    return ZERO_METRICS;
  }

  const orgUrn = encodeURIComponent(`urn:li:organization:${organizationId}`);

  // Step 2: Fetch page statistics (impressions, engagement)
  let impressions = 0;
  let clicks = 0;
  let likes = 0;
  let comments = 0;
  let shares = 0;

  try {
    const response = await fetch(
      `${LINKEDIN_API_BASE_URL}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${thirtyDaysAgoMs()}`,
      { headers: { Authorization: `Bearer ${accessToken}`, 'LinkedIn-Version': '202304' } }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[linkedinSocialClient] Failed to fetch share statistics for tenant ${tenantId}: ${response.status} ${error}`);
    } else {
      const data = await response.json() as LinkedInShareStatsResponse;
      for (const element of data.elements ?? []) {
        const stats = element.totalShareStatistics;
        impressions += stats?.impressionCount ?? 0;
        clicks += stats?.clickCount ?? 0;
        likes += stats?.likeCount ?? 0;
        comments += stats?.commentCount ?? 0;
        shares += stats?.shareCount ?? 0;
      }
    }
  } catch (err) {
    console.error(`[linkedinSocialClient] Unexpected error fetching share statistics for tenant ${tenantId}:`, err);
  }

  // Step 3: Fetch follower count
  let followerCount = 0;
  try {
    const response = await fetch(
      `${LINKEDIN_API_BASE_URL}/networkSizes/${orgUrn}?edgeType=CompanyFollowedByMember`,
      { headers: { Authorization: `Bearer ${accessToken}`, 'LinkedIn-Version': '202304' } }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[linkedinSocialClient] Failed to fetch follower count for tenant ${tenantId}: ${response.status} ${error}`);
    } else {
      const data = await response.json() as LinkedInNetworkSizeResponse;
      followerCount = data.firstDegreeSize ?? 0;
    }
  } catch (err) {
    console.error(`[linkedinSocialClient] Unexpected error fetching follower count for tenant ${tenantId}:`, err);
  }

  const totalEngagements = clicks + likes + comments + shares;
  const engagementRate = impressions > 0 ? (totalEngagements / impressions) * 100 : 0;

  return {
    impressions,
    reach: impressions, // LinkedIn share statistics use impressions as reach proxy
    engagementRate,
    followerCount,
  };
}

function thirtyDaysAgoMs(): number {
  return Date.now() - 30 * 24 * 60 * 60 * 1000;
}

// Internal types for LinkedIn API responses
interface LinkedInAclResponse {
  elements?: Array<{
    'organizationalTarget~'?: { id?: number };
  }>;
}

interface LinkedInShareStatsResponse {
  elements?: Array<{
    totalShareStatistics?: {
      impressionCount?: number;
      clickCount?: number;
      likeCount?: number;
      commentCount?: number;
      shareCount?: number;
    };
  }>;
}

interface LinkedInNetworkSizeResponse {
  firstDegreeSize?: number;
}
