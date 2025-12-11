// MarketPulse API Client
// Connects frontend to Railway backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mallanproject-production.up.railway.app';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface MetricsResponse {
  success: boolean;
  data: {
    date: string;
    region: string;
    brand: {
      name: string;
      keywords: string[];
    };
    metrics: {
      marketShareMomentum: {
        score: number;
        trend: string;
        change: number;
        confidence: number;
      };
      competitivePressure: {
        score: number;
        level: string;
        trend: string;
      };
      searchIntentShift: {
        comparison: { volume: number; change: number };
        problem: { volume: number; change: number };
        regulation: { volume: number; change: number };
        product: { volume: number; change: number };
        review: { volume: number; change: number };
      };
      brandHealth: {
        shareOfSearch: number;
        searchVolume: number;
        weeklyChange: number;
        marketRank: number;
      };
      sentimentVelocity: {
        score: number;
        trend: string;
        positiveRatio: number;
      };
    };
    marketOpportunity: {
      tam: {
        volume: number;
        weeklyChange: number;
        trend: string;
      };
      categories: Array<{
        name: string;
        volume: number;
        percentage: number;
        trend: string;
      }>;
    };
  };
  meta: {
    lastUpdated: string;
    dataSource: string;
  };
}

export interface MetricsHistoryResponse {
  success: boolean;
  data: {
    history: Array<{
      date: string;
      brandVolume: number;
      marketVolume: number;
      shareOfSearch: number;
      competitivePressure: number;
    }>;
    period: string;
    dataPoints: number;
  };
}

export interface Competitor {
  id: number;
  name: string;
  searchVolume: number;
  weeklyChange: number;
  marketShare: number;
  velocityTrend: string;
  riskLevel: string;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

export interface CompetitorsResponse {
  success: boolean;
  data: {
    competitors: Competitor[];
    yourBrand: {
      name: string;
      searchVolume: number;
      marketShare: number;
      rank: number;
    };
    marketTotal: number;
  };
  meta: {
    lastUpdated: string;
    competitorCount: number;
  };
}

export interface Alert {
  id: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  metric: string;
  value: number | string;
  threshold: number | string;
  recommendation: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface AlertsResponse {
  success: boolean;
  data: {
    alerts: Alert[];
    summary: {
      total: number;
      high: number;
      medium: number;
      low: number;
      unacknowledged: number;
    };
  };
  meta: {
    lastUpdated: string;
  };
}

// ===========================================
// FETCH WRAPPER
// ===========================================

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ===========================================
// API FUNCTIONS
// ===========================================

export const api = {
  // Health check
  health: () => fetchAPI<{ status: string; timestamp: string }>('/api/health'),

  // Metrics
  getMetrics: () => fetchAPI<MetricsResponse>('/api/metrics'),
  getMetricsHistory: (weeks = 12) => fetchAPI<MetricsHistoryResponse>(`/api/metrics/history?weeks=${weeks}`),
  getMetricsSummary: () => fetchAPI<any>('/api/metrics/summary'),

  // Competitors
  getCompetitors: () => fetchAPI<CompetitorsResponse>('/api/competitors'),
  getCompetitor: (id: number) => fetchAPI<any>(`/api/competitors/${id}`),

  // Alerts
  getAlerts: (limit = 10) => fetchAPI<AlertsResponse>(`/api/alerts?limit=${limit}`),
  getAlertCount: () => fetchAPI<any>('/api/alerts/count'),
};

export default api;
