// React Query hooks for competitor data
import { useQuery } from '@tanstack/react-query';
import { api, CompetitorsResponse } from '../lib/api';

// Fetch all competitors
export function useCompetitors() {
  return useQuery<CompetitorsResponse>({
    queryKey: ['competitors'],
    queryFn: api.getCompetitors,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

// Fetch single competitor detail
export function useCompetitor(id: number) {
  return useQuery({
    queryKey: ['competitor', id],
    queryFn: () => api.getCompetitor(id),
    enabled: !!id, // Only fetch if id is provided
    staleTime: 5 * 60 * 1000,
  });
}
