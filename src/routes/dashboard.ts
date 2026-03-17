import { Router, Request, Response } from 'express';
import { pool } from '../db/cache';
import { getGa4Metrics } from '../services/ga4Client';
import { getGoogleAdsMetrics } from '../services/googleAdsClient';
import { getSearchConsoleMetrics } from '../services/searchConsoleClient';
import { getMetaAdsMetrics } from '../services/metaAdsClient';
import { getMetaSocialMetrics } from '../services/metaSocialClient';

const router = Router();

const CACHE_KEY = 'tenant_dashboard';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const DEFAULT_ADS = { spend: 0, cpa: 0, roas: 0, conversions: 0, ctr: 0, googleAds: {} as Record<string, unknown>, metaAds: {} as Record<string, unknown> };
const DEFAULT_WEBSITE = { sessions: 0, users: 0, newUsers: 0, bounceRate: 0, topSources: [] as Array<{ source: string; sessions: number }> };
const DEFAULT_BRAND = { impressions: 0, clicks: 0, avgPosition: 0, topQueries: [] as any[] };
const DEFAULT_SOCIAL = { reach: 0, impressions: 0, engagementRate: 0, followerGrowth: 0, platforms: {} as Record<string, unknown> };

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

  // Fetch all five sources in parallel — if one fails, others still return data
  const [websiteResult, adsResult, brandResult, metaAdsResult, metaSocialResult] = await Promise.allSettled([
    getGa4Metrics(tenantId),
    getGoogleAdsMetrics(tenantId),
    getSearchConsoleMetrics(tenantId),
    getMetaAdsMetrics(tenantId),
    getMetaSocialMetrics(tenantId),
  ]);

  let website = DEFAULT_WEBSITE;
  if (websiteResult.status === 'fulfilled') {
    const w = websiteResult.value;
    website = { sessions: w.sessions, users: w.users, newUsers: w.newUsers, bounceRate: w.bounceRate, topSources: w.topSources };
  } else {
    console.error('[dashboard] GA4 error for tenant', tenantId, ':', websiteResult.reason);
  }

  const googleAds = adsResult.status === 'fulfilled' ? adsResult.value : null;
  if (adsResult.status === 'rejected') {
    console.error('[dashboard] Google Ads error for tenant', tenantId, ':', adsResult.reason);
  }

  const metaAds = metaAdsResult.status === 'fulfilled' ? metaAdsResult.value : null;
  if (metaAdsResult.status === 'rejected') {
    console.error('[dashboard] Meta Ads error for tenant', tenantId, ':', metaAdsResult.reason);
  }

  const gSpend = googleAds?.spend ?? 0;
  const gConversions = googleAds?.conversions ?? 0;
  const gConversionsValue = gSpend > 0 && googleAds ? googleAds.roas * gSpend : 0;
  const gClicks = googleAds?.clicks ?? 0;
  const gImpressions = googleAds?.impressions ?? 0;

  const mSpend = metaAds?.spend ?? 0;
  const mConversions = metaAds?.conversions ?? 0;
  const mConversionsValue = mSpend > 0 && metaAds ? metaAds.roas * mSpend : 0;
  const mClicks = metaAds?.clicks ?? 0;
  const mImpressions = metaAds?.impressions ?? 0;

  const combinedSpend = gSpend + mSpend;
  const combinedConversions = gConversions + mConversions;
  const combinedConversionsValue = gConversionsValue + mConversionsValue;
  const combinedClicks = gClicks + mClicks;
  const combinedImpressions = gImpressions + mImpressions;

  const ads = {
    spend: combinedSpend,
    cpa: combinedConversions > 0 ? combinedSpend / combinedConversions : 0,
    roas: combinedSpend > 0 ? combinedConversionsValue / combinedSpend : 0,
    conversions: combinedConversions,
    ctr: combinedImpressions > 0 ? (combinedClicks / combinedImpressions) * 100 : 0,
    googleAds: googleAds ? { spend: gSpend, cpa: googleAds.cpa, roas: googleAds.roas, conversions: gConversions, ctr: googleAds.ctr, clicks: gClicks, impressions: gImpressions } : {},
    metaAds: metaAds ? { spend: mSpend, cpa: metaAds.cpa, roas: metaAds.roas, conversions: mConversions, ctr: metaAds.ctr, clicks: mClicks, impressions: mImpressions } : {},
  };

  let brand = DEFAULT_BRAND;
  if (brandResult.status === 'fulfilled') {
    const b = brandResult.value;
    brand = { impressions: b.impressions, clicks: b.clicks, avgPosition: b.avgPosition, topQueries: b.topQueries };
  } else {
    console.error('[dashboard] Search Console error for tenant', tenantId, ':', brandResult.reason);
  }

  let social = DEFAULT_SOCIAL;
  if (metaSocialResult.status === 'fulfilled') {
    const s = metaSocialResult.value;
    social = { reach: s.reach, impressions: s.impressions, engagementRate: s.engagementRate, followerGrowth: s.followerGrowth, platforms: s.platforms };
  } else {
    console.error('[dashboard] Meta Social error for tenant', tenantId, ':', metaSocialResult.reason);
  }

  const response = { ads, website, brand, social };

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
