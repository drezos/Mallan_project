import { getValidAccessToken } from './tokenManager';
import { pool } from '../db/cache';

export interface SearchConsoleMetrics {
  impressions: number;
  clicks: number;
  avgPosition: number;
  ctr: number;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    position: number;
  }>;
}

const EMPTY_RESULT: SearchConsoleMetrics = {
  impressions: 0,
  clicks: 0,
  avgPosition: 0,
  ctr: 0,
  topQueries: [],
};

export async function getSearchConsoleMetrics(tenantId: string): Promise<SearchConsoleMetrics> {
  const tenantResult = await pool.query(
    `SELECT brand_url FROM tenants WHERE id = $1`,
    [tenantId]
  );

  if (tenantResult.rows.length === 0 || !tenantResult.rows[0].brand_url) {
    return EMPTY_RESULT;
  }

  const brandUrl: string = tenantResult.rows[0].brand_url;
  const siteUrl = encodeURIComponent(`sc-domain:${brandUrl}`);

  const access_token = await getValidAccessToken(tenantId, 'google');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['query'],
        rowLimit: 10,
        orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
      }),
    }
  );

  if (!response.ok) {
    return EMPTY_RESULT;
  }

  const data = await response.json() as {
    rows?: Array<{
      keys: string[];
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>;
  };

  if (!data.rows || data.rows.length === 0) {
    return EMPTY_RESULT;
  }

  const topQueries = data.rows.map((row) => ({
    query: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    position: row.position,
  }));

  const totalClicks = topQueries.reduce((sum, q) => sum + q.clicks, 0);
  const totalImpressions = topQueries.reduce((sum, q) => sum + q.impressions, 0);
  const avgPosition =
    topQueries.length > 0
      ? topQueries.reduce((sum, q) => sum + q.position, 0) / topQueries.length
      : 0;
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  return {
    impressions: totalImpressions,
    clicks: totalClicks,
    avgPosition,
    ctr,
    topQueries,
  };
}
