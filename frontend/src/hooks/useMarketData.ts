// React Query hooks for fetching market data
// Falls back to mock data if API fails

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  mockBrandData,
  mockShareOfSearch,
  mockMarketRank,
  mockMarketOpportunity,
  mockTAMTrendData,
  mockTAM,
  mockTAMGrowth,
  mockCompetitors,
  mockCompetitiveTrendData,
  topRivals,
  mockAnomalies,
} from '../lib/mockData';

// ===========================================
// TRANSFORM API DATA TO COMPONENT FORMAT
// ===========================================

function transformMetricsData(apiData: any) {
  if (!apiData?.data) return null;
  
  const { metrics, marketOpportunity } = apiData.data;
  
  return {
    brandData: {
      name: apiData.data.brand?.name || 'Jacks.nl',
      searchVolume: metrics?.brandHealth?.searchVolume || 0,
      growth: metrics?.brandHealth?.weeklyChange || 0,
      marketShare: metrics?.brandHealth?.shareOfSearch || 0,
    },
    shareOfSearch: {
      current: metrics?.brandHealth?.shareOfSearch || 0,
      change: metrics?.brandHealth?.weeklyChange || 0,
      weeklyHistory: [], // Will be populated from history endpoint
    },
    marketRank: {
      current: metrics?.brandHealth?.marketRank || 0,
      previous: (metrics?.brandHealth?.marketRank || 0) + 1,
      change: 1,
      total: 10,
      totalCompetitors: 10,
    },
    marketOpportunity: {
      yourBrand: marketOpportunity?.categories?.find((c: any) => c.name === 'Your Brand')?.volume || 0,
      competitors: marketOpportunity?.categories?.find((c: any) => c.name === 'Competitors')?.volume || 0,
      generic: marketOpportunity?.categories?.find((c: any) => c.name === 'Generic')?.volume || 0,
      total: marketOpportunity?.tam?.volume || 0,
    },
    tam: {
      total: marketOpportunity?.tam?.volume || 0,
      growth: marketOpportunity?.tam?.weeklyChange || 0,
    },
  };
}

function transformCompetitorsData(apiData: any) {
  if (!apiData?.data?.competitors) return null;
  
  return apiData.data.competitors.map((c: any) => ({
    id: c.id,
    name: c.name,
    searchVolume: c.searchVolume,
    weeklyChange: c.weeklyChange,
    marketShare: c.marketShare,
    velocityTrend: c.velocityTrend,
    riskLevel: c.riskLevel,
  }));
}

function transformAlertsData(apiData: any) {
  if (!apiData?.data?.alerts) return null;
  
  return apiData.data.alerts.map((a: any) => ({
    id: a.id,
    type: a.type,
    severity: a.severity,
    title: a.title,
    message: a.message,
    metric: a.metric,
    value: a.value,
    change: 0,
    timestamp: a.createdAt,
  }));
}

// ===========================================
// REACT QUERY HOOKS
// ===========================================

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const data = await api.getMetrics();
      return transformMetricsData(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useCompetitors() {
  return useQuery({
    queryKey: ['competitors'],
    queryFn: async () => {
      const data = await api.getCompetitors();
      return {
        competitors: transformCompetitorsData(data),
        yourBrand: data?.data?.yourBrand,
        marketTotal: data?.data?.marketTotal,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useAlerts(limit = 5) {
  return useQuery({
    queryKey: ['alerts', limit],
    queryFn: async () => {
      const data = await api.getAlerts(limit);
      return transformAlertsData(data);
    },
    staleTime: 2 * 60 * 1000, // Alerts refresh more frequently
    retry: 2,
  });
}

export function useMetricsHistory(weeks = 12) {
  return useQuery({
    queryKey: ['metrics-history', weeks],
    queryFn: () => api.getMetricsHistory(weeks),
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });
}

// ===========================================
// COMBINED HOOK WITH FALLBACK TO MOCK DATA
// ===========================================

export function useDashboardData() {
  const metricsQuery = useMetrics();
  const competitorsQuery = useCompetitors();
  const alertsQuery = useAlerts();
  // Note: historyQuery available for future use when we need historical data

  const isLoading = metricsQuery.isLoading || competitorsQuery.isLoading;
  const isError = metricsQuery.isError && competitorsQuery.isError;

  // Use API data if available, otherwise fall back to mock data
  const data = {
    // Brand data
    brandData: metricsQuery.data?.brandData || mockBrandData,
    
    // Share of search
    shareOfSearch: metricsQuery.data?.shareOfSearch || mockShareOfSearch,
    
    // Market rank
    marketRank: metricsQuery.data?.marketRank || mockMarketRank,
    
    // Market opportunity
    marketOpportunity: metricsQuery.data?.marketOpportunity || mockMarketOpportunity,
    
    // TAM data
    tamTrendData: mockTAMTrendData, // Using mock for now (complex transform)
    tam: metricsQuery.data?.tam || mockTAM,
    tamGrowth: metricsQuery.data?.tam?.growth || mockTAMGrowth,
    
    // Competitors
    competitors: competitorsQuery.data?.competitors || mockCompetitors,
    
    // Trend data (using mock for now)
    competitiveTrendData: mockCompetitiveTrendData,
    topRivals: topRivals,
    
    // Alerts/Anomalies
    anomalies: alertsQuery.data || mockAnomalies,
  };

  return {
    data,
    isLoading,
    isError,
    refetch: () => {
      metricsQuery.refetch();
      competitorsQuery.refetch();
      alertsQuery.refetch();
    },
  };
}
