// React Query hook for fetching competitors data

import { useQuery } from '@tanstack/react-query';
import { api, CompetitorsResponse } from '../lib/api';

export function useCompetitors() {
  return useQuery({
    queryKey: ['competitors'],
    queryFn: () => api.getCompetitors(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useCompetitor(name: string) {
  return useQuery({
    queryKey: ['competitor', name],
    queryFn: () => api.getCompetitor(name),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!name, // Only run if name is provided
  });
}
