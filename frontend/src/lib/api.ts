// API Client for MarketPulse
// Connects to Railway backend

const API_BASE_URL = 'https://mallanproject-production.up.railway.app';
const ANALYTICS_API_URL = import.meta.env.VITE_API_URL || API_BASE_URL;

// ===========================================
// TYPES
// ===========================================

export interface MetricsResponse {
  success: boolean;
  data: {
    date: string;
    region: string;
    brand: { name: string; keywords: string[] };
    metrics: {
      marketShareMomentum: { score: number; trend: string; change: number; confidence: number };
      competitivePressure: { score: number; level: string; trend: string };
      searchIntentShift: {
        comparison: { volume: number; change: number };
        problem: { volume: number; change: number };
        regulation: { volume: number; change: number };
        product: { volume: number; change: number };
        review: { volume: number; change: number };
      };
      brandHealth: { shareOfSearch: number; searchVolume: number; weeklyChange: number; marketRank: number };
      sentimentVelocity: { score: number; trend: string; positiveRatio: number };
      marketOpportunity: {
        tam: number;
        weeklyChange: number;
        trend: string;
        categories: Array<{ name: string; volume: number; percentage: number; trend: string }>;
      };
    };
  };
  meta?: { lastUpdated: string; dataSource: string; cacheAge?: string };
}

export interface MetricsHistoryResponse {
  success: boolean;
  data: {
    weeks: number;
    history: Array<{
      date: string;
      metrics: {
        shareOfSearch: number;
        searchVolume: number;
        tam: number;
      };
    }>;
  };
}

export interface CompetitorsResponse {
  success: boolean;
  data: {
    competitors: Array<{
      id: number;
      name: string;
      searchVolume: number;         // Monthly search volume
      marketShare: number;          // % of monthly market share
      monthlyChange: number;        // Month-over-month % change (MoM)
      trend: string;
      riskLevel: string;
      velocityTrend: string;
    }>;
    yourBrand: { name: string; searchVolume: number; marketShare: number };
    marketTotal: number;
  };
}

export interface AlertsResponse {
  success: boolean;
  data: {
    alerts: Array<{
      id: string;
      type: string;
      severity: 'high' | 'medium' | 'low';
      title: string;
      message: string;
      timestamp: string;
      actionable: boolean;
      recommendation?: string;
      metric?: { name: string; value: number; change: number };
    }>;
    count: number;
  };
}

// ===========================================
// API OBJECT
// ===========================================

export interface DashboardResponse {
  success: boolean;
  data: {
    overview: {
      totalMarketVolume: number;      // Total monthly market volume
      totalPriorityVolume: number;    // Total monthly priority keyword volume
      yourBrand: {
        name: string;
        volume: number;               // Monthly search volume
        priorityKeyword: string;
        priorityVolume: number;       // Monthly priority keyword volume
        marketShare: number;          // % of monthly market share
        priorityMarketShare: number;  // % of monthly priority market share
      };
      marketShareMomentum: any;
      competitivePressure: any;
      playerSentiment: any;
    };
    brands: Array<{
      rank: number;                   // Rank by monthly volume
      brandId: string;
      brandName: string;
      volume: number;                 // Monthly search volume
      priorityKeyword: string;
      priorityVolume: number;         // Monthly priority keyword volume
      marketShare: number;            // % of monthly market share
      priorityMarketShare: number;    // % of monthly priority market share
      velocity?: number;              // Month-over-month % change (MoM)
      isOwnBrand: boolean;
      color?: string;
    }>;
    trends: any;
    intentCategories: Array<{
      category: string;
      displayName: string;
      volume: number;
    }>;
    alerts: Array<{
      type: string;
      severity: string;
      message: string;
    }>;
    // Pre-calculated competitor highlights for stable display
    competitorHighlights?: {
      fastestGrowing: { name: string; velocity: number };
      biggestDecline: { name: string; velocity: number };
    };
    metrics: any;
    fetchedAt: string;
    lastUpdated?: string;
    _meta?: {
      source: string;
      cached_at: string;
      expires_at: string;
    };
  };
}

export interface AdsPlatformMetrics {
  spend: number;
  cpa: number;
  roas: number;
  conversions: number;
  ctr: number;
  clicks: number;
  impressions: number;
}

export interface WebsiteMetric {
  current: number;
  previous: number;
  change: number;
}

export type WebsitePillar =
  | { connected: false }
  | {
      connected: true;
      propertyId?: string;
      propertyName: string;
      metrics: {
        sessions: WebsiteMetric;
        newUsers: WebsiteMetric;
        bounceRate: WebsiteMetric;
        engagementRate: WebsiteMetric;
      };
      topSources: Array<{ source: string; sessions: number }>;
    };

export interface BrandMetric {
  current: number;
  previous: number;
  change: number;
}

export type BrandPillar =
  | { connected: false }
  | {
      connected: true;
      siteUrl: string;
      metrics: {
        impressions: BrandMetric;
        clicks: BrandMetric;
        avgPosition: BrandMetric;
        ctr: BrandMetric;
      };
      topQueries: Array<{
        query: string;
        clicks: number;
        impressions: number;
        position: number;
        ctr: number;
      }>;
    };

export interface AnalyticsDashboardResponse {
  ads: AdsPlatformMetrics & {
    google: AdsPlatformMetrics;
    meta: AdsPlatformMetrics;
    linkedin: AdsPlatformMetrics;
  };
  website: WebsitePillar;
  brand: BrandPillar;
  social: SocialPillar;
}

export interface SocialMetric {
  current: number;
  previous: number;
  change: number;
}

export interface FacebookPlatformConnected {
  connected: true;
  pageName: string;
  metrics: {
    impressions: SocialMetric;
    engagedUsers: SocialMetric;
    fans: SocialMetric;
    newFans: SocialMetric;
  };
}

export type FacebookPlatform =
  | FacebookPlatformConnected
  | { connected: false };

export type SocialPillar =
  | { connected: false }
  | {
      connected: true;
      platforms: {
        facebook: FacebookPlatform;
        instagram: { connected: false };
        linkedin: { connected: false };
      };
      reach: SocialMetric;
      impressions: SocialMetric;
      engagementRate: SocialMetric;
    };

export const api = {
  /**
   * Fetch dashboard data for a tenant
   * @param tenant - Optional tenant name or ID. Defaults to Jacks.nl if not provided.
   */
  async getDashboard(tenant?: string): Promise<DashboardResponse | null> {
    try {
      const url = new URL(`${API_BASE_URL}/api/market/dashboard`);
      if (tenant) {
        url.searchParams.set('tenant', tenant);
      }
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return null;
    }
  },

  async getMetrics(): Promise<MetricsResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/market/metrics`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return null;
    }
  },

  async getMetricsSummary(): Promise<MetricsResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics/summary`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics summary:', error);
      return null;
    }
  },

  async getMetricsHistory(weeks = 12): Promise<MetricsHistoryResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics/history?weeks=${weeks}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics history:', error);
      return null;
    }
  },

  async getCompetitors(): Promise<CompetitorsResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/competitors`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching competitors:', error);
      return null;
    }
  },

  async getCompetitor(name: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/competitors/${encodeURIComponent(name)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching competitor:', error);
      return null;
    }
  },

  async getAlerts(limit = 5): Promise<AlertsResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts?limit=${limit}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return null;
    }
  },

  async getAlertCount(): Promise<{ count: number; highPriority: number } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/high-priority`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { count: data.data?.count || 0, highPriority: data.data?.count || 0 };
    } catch (error) {
      console.error('Error fetching alert count:', error);
      return { count: 0, highPriority: 0 };
    }
  },

  async getAnalyticsDashboard(tenantId: string): Promise<AnalyticsDashboardResponse | null> {
    try {
      const url = new URL(`${ANALYTICS_API_URL}/api/dashboard`);
      url.searchParams.set('tenant_id', tenantId);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics dashboard:', error);
      return null;
    }
  },
};

// ===========================================
// LEGACY EXPORTS (for backward compatibility)
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { lastUpdated: string; dataSource: string; cacheAge?: string };
  error?: string;
}

export interface MetricsData {
  date: string;
  region: string;
  brand: { name: string; keywords: string[] };
  metrics: {
    marketShareMomentum: { score: number; trend: string; change: number; confidence: number };
    competitivePressure: { score: number; level: string; trend: string };
    searchIntentShift: {
      comparison: { volume: number; change: number };
      problem: { volume: number; change: number };
      regulation: { volume: number; change: number };
      product: { volume: number; change: number };
      review: { volume: number; change: number };
    };
    brandHealth: { shareOfSearch: number; searchVolume: number; monthlyChange: number; marketRank: number };
    sentimentVelocity: { score: number; trend: string; positiveRatio: number };
    marketOpportunity: {
      tam: number;
      monthlyChange: number;
      trend: string;
      categories: Array<{ name: string; volume: number; percentage: number; trend: string }>;
    };
  };
}

export interface CompetitorData {
  name: string;
  searchVolume: number;         // Monthly search volume
  marketShare: number;          // % of monthly market share
  monthlyChange: number;        // Month-over-month % change (MoM)
  trend: string;
  riskLevel: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  actionable: boolean;
  recommendation?: string;
}
