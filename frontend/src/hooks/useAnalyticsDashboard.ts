import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useAnalyticsDashboard(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['analytics-dashboard', tenantId ?? ''],
    queryFn: () => api.getAnalyticsDashboard(tenantId!),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!tenantId,
  });
}
