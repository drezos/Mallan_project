// React Query hooks for alerts data
import { useQuery } from '@tanstack/react-query';
import { api, AlertsResponse } from '../lib/api';

// Fetch alerts
export function useAlerts(limit = 10) {
  return useQuery<AlertsResponse>({
    queryKey: ['alerts', limit],
    queryFn: () => api.getAlerts(limit),
    staleTime: 2 * 60 * 1000, // Alerts should be fresher
    refetchInterval: 5 * 60 * 1000, // Check for new alerts more frequently
  });
}

// Fetch alert count for badge
export function useAlertCount() {
  return useQuery({
    queryKey: ['alert-count'],
    queryFn: api.getAlertCount,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}
