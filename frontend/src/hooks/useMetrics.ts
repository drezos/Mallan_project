// React Query hook for fetching metrics data

import { useQuery } from '@tanstack/react-query';
import { api, MetricsResponse, MetricsHistoryResponse } from '../lib/api';

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: () => api.getMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useMetricsSummary() {
  return useQuery({
    queryKey: ['metrics-summary'],
    queryFn: () => api.getMetrics(), // Use same endpoint, backend returns summary format
    staleTime: 5 * 60 * 1000,
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
