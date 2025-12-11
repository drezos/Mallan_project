// React Query hooks for metrics data
import { useQuery } from '@tanstack/react-query';
import { api, MetricsResponse, MetricsHistoryResponse } from '../lib/api';

// Fetch current metrics
export function useMetrics() {
  return useQuery<MetricsResponse>({
    queryKey: ['metrics'],
    queryFn: api.getMetrics,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

// Fetch metrics history for charts
export function useMetricsHistory(weeks = 12) {
  return useQuery<MetricsHistoryResponse>({
    queryKey: ['metrics-history', weeks],
    queryFn: () => api.getMetricsHistory(weeks),
    staleTime: 15 * 60 * 1000, // History data is more stable
  });
}

// Fetch metrics summary
export function useMetricsSummary() {
  return useQuery({
    queryKey: ['metrics-summary'],
    queryFn: api.getMetricsSummary,
    staleTime: 5 * 60 * 1000,
  });
}
