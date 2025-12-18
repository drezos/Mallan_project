// React Query hook for fetching dashboard data from /api/market/dashboard

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
