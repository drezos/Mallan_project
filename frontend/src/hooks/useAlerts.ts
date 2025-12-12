// React Query hook for fetching alerts data

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useAlerts(limit = 5) {
  return useQuery({
    queryKey: ['alerts', limit],
    queryFn: () => api.getAlerts(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

export function useAlertCount() {
  return useQuery({
    queryKey: ['alert-count'],
    queryFn: () => api.getAlertCount(),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}
