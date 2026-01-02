// React Query hook for fetching dashboard data from /api/market/dashboard

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/**
 * Hook to fetch dashboard data
 * @param tenant - Optional tenant name or ID. Defaults to Jacks.nl if not provided.
 */
export function useDashboard(tenant?: string) {
  return useQuery({
    // Include tenant in query key so different tenants have separate cache entries
    queryKey: ['dashboard', tenant],
    queryFn: () => api.getDashboard(tenant),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
