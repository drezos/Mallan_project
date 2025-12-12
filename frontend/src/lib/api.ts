// API Client for MarketPulse
// Connects to Railway backend and transforms data for frontend components

const API_BASE_URL = 'https://mallanproject-production.up.railway.app';

// ===========================================
// TYPES - Matching what the backend returns
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

// ===========================================
// API FUNCTIONS
// ===========================================

export async function fetchMetrics(): Promise<MetricsData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/metrics`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: ApiResponse<MetricsData> = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return null;
  }
}

export async function fetchCompetitors(): Promise<CompetitorData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/competitors`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: ApiResponse<{ competitors: CompetitorData[] }> = await response.json();
    if (json.success && json.data?.competitors) {
      return json.data.competitors;
    }
    return [];
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return [];
  }
}

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: ApiResponse<{ alerts: Alert[] }> = await response.json();
    if (json.success && json.data?.alerts) {
      return json.data.alerts;
    }
    return [];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  return num.toLocaleString('nl-NL');
}

export function formatPercent(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0%';
  }
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
}

export function formatScore(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0.0';
  }
  return num.toFixed(1);
}

export function getTrendColor(trend: string | undefined): string {
  switch (trend?.toLowerCase()) {
    case 'growing':
    case 'gaining':
    case 'up':
      return 'text-green-600';
    case 'declining':
    case 'losing':
    case 'down':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function getSeverityColor(severity: string | undefined): string {
  switch (severity?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
