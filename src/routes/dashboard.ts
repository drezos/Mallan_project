import { Router, Request, Response } from 'express';
import { pool } from '../db/cache';
import { getGa4Metrics } from '../services/ga4Client';
import { getGoogleAdsMetrics } from '../services/googleAdsClient';
import { getSearchConsoleMetrics } from '../services/searchConsoleClient';

const router = Router();

const CACHE_KEY = 'tenant_dashboard';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const DEFAULT_ADS = { spend: 0, cpa: 0, roas: 0, conversions: 0, ctr: 0 };
const DEFAULT_WEBSITE = { sessions: 0, users: 0, newUsers: 0, bounceRate: 0, topSources: [] as Array<{ source: string; sessions: number }> };
const DEFAULT_BRAND = { impressions: 0, clicks: 0, avgPosition: 0, topQueries: [] as any[] };

router.get('/', async (req: Request, res: Response) => {
  const tenantId = req.query.tenant_id as string;

  if (!tenantId) {
    return res.status(400).json({ error: 'tenant_id query parameter is required' });
  }

  // Check tenant cache first
  try {
    const cached = await pool.query(
      `SELECT data, expires_at, (expires_at < NOW()) as is_expired
       FROM tenant_cache
       WHERE tenant_id = $1 AND cache_key = $2`,
      [tenantId, CACHE_KEY]
    );

    if (cached.rows.length > 0 && !cached.rows[0].is_expired) {
      console.log(`[dashboard] Serving cached data for tenant ${tenantId}`);
      return res.json(cached.rows[0].data);
    }
  } catch (err) {
    console.error('[dashboard] Cache read error:', err);
  }

  // Fetch all three sources in parallel — if one fails, others still return data
  const [websiteResult, adsResult, brandResult] = await Promise.allSettled([
    getGa4Metrics(tenantId),
    getGoogleAdsMetrics(tenantId),
    getSearchConsoleMetrics(tenantId),
  ]);

  let website = DEFAULT_WEBSITE;
  if (websiteResult.status === 'fulfilled') {
    const w = websiteResult.value;
    website = { sessions: w.sessions, users: w.users, newUsers: w.newUsers, bounceRate: w.bounceRate, topSources: w.topSources };
  } else {
    console.error('[dashboard] GA4 error for tenant', tenantId, ':', websiteResult.reason);
  }

  let ads = DEFAULT_ADS;
  if (adsResult.status === 'fulfilled') {
    const a = adsResult.value;
    ads = { spend: a.spend, cpa: a.cpa, roas: a.roas, conversions: a.conversions, ctr: a.ctr };
  } else {
    console.error('[dashboard] Google Ads error for tenant', tenantId, ':', adsResult.reason);
  }

  let brand = DEFAULT_BRAND;
  if (brandResult.status === 'fulfilled') {
    const b = brandResult.value;
    brand = { impressions: b.impressions, clicks: b.clicks, avgPosition: b.avgPosition, topQueries: b.topQueries };
  } else {
    console.error('[dashboard] Search Console error for tenant', tenantId, ':', brandResult.reason);
  }

  const response = { ads, website, brand, social: {} };

  // Cache result with 24-hour expiry
  try {
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);
    await pool.query(
      `INSERT INTO tenant_cache (tenant_id, cache_key, data, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, cache_key)
       DO UPDATE SET data = $3, expires_at = $4, created_at = NOW()`,
      [tenantId, CACHE_KEY, JSON.stringify(response), expiresAt]
    );
  } catch (err) {
    console.error('[dashboard] Cache write error:', err);
  }

  return res.json(response);
});

export default router;
