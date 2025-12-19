// API Client for MarketPulse
// Connects to Railway backend

const API_BASE_URL = 'https://mallanproject-production.up.railway.app';

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
      searchVolume: number;
      marketShare: number;
      weeklyChange: number;
      monthlyChange: number;
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
      totalMarketVolume: number;
      yourBrand: {
        name: string;
        volume: number;
        marketShare: number;
      };
      marketShareMomentum: any;
      competitivePressure: any;
      playerSentiment: any;
    };
    brands: Array<{
      rank: number;
      brandId: string;
      brandName: string;
      volume: number;
      marketShare: number;
      velocity: number;
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
    metrics: any;
    fetchedAt: string;
    _meta?: {
      source: string;
      cached_at: string;
      expires_at: string;
    };
  };
}

export const api = {
  async getDashboard(): Promise<DashboardResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/market/dashboard`);
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
    brandHealth: { shareOfSearch: number; searchVolume: number; weeklyChange: number; marketRank: number };
    sentimentVelocity: { score: number; trend: string; positiveRatio: number };
    marketOpportunity: {
      tam: number;
      weeklyChange: number;
      trend: string;
      categories: Array<{ name: string; volume: number; percentage: number; trend: string }>;
    };
  };
}

export interface CompetitorData {
  name: string;
  searchVolume: number;
  marketShare: number;
  weeklyChange: number;
  monthlyChange: number;
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
