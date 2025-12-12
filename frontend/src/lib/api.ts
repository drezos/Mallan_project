// API Client for MarketPulse
// Connects to Railway backend

const API_BASE_URL = 'https://mallanproject-production.up.railway.app';

// ===========================================
// API OBJECT (used by useMarketData.ts)
// ===========================================

export const api = {
  async getMetrics() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return null;
    }
  },

  async getCompetitors() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/competitors`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching competitors:', error);
      return null;
    }
  },

  async getAlerts(limit = 5) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts?limit=${limit}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return null;
    }
  },

  async getMetricsHistory(weeks = 12) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics/history?weeks=${weeks}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics history:', error);
      return null;
    }
  },
};

// ===========================================
// TYPES
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    lastUpdated: string;
    dataSource: string;
    cacheAge?: string;
  };
  error?: string;
}

export interface MetricsData {
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
    marketOpportunity: {
      tam: number;
      weeklyChange: number;
      trend: string;
      categories: Array<{
        name: string;
        volume: number;
        percentage: number;
        trend: string;
      }>;
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
