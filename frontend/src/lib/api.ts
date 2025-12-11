// MarketPulse API Client
// Connects frontend to Railway backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mallanproject-production.up.railway.app';

// Generic fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ===========================================
// API FUNCTIONS
// ===========================================

export const api = {
  // Health check
  health: () => fetchAPI<{ status: string; timestamp: string }>('/api/health'),

  // Metrics
  getMetrics: () => fetchAPI<any>('/api/metrics'),
  getMetricsHistory: (weeks = 12) => fetchAPI<any>(`/api/metrics/history?weeks=${weeks}`),
  getMetricsSummary: () => fetchAPI<any>('/api/metrics/summary'),

  // Competitors
  getCompetitors: () => fetchAPI<any>('/api/competitors'),
  getCompetitor: (id: number) => fetchAPI<any>(`/api/competitors/${id}`),

  // Alerts
  getAlerts: (limit = 10) => fetchAPI<any>(`/api/alerts?limit=${limit}`),
  getAlertCount: () => fetchAPI<any>('/api/alerts/count'),
};

export default api;
