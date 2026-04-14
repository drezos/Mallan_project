import { Router, Request, Response } from 'express';
import { pool } from '../db/cache';
import { getMetaAdsMetrics } from '../services/metaAdsClient';
import { getLinkedInAdsMetrics } from '../services/linkedinAdsClient';
import {
  getGoogleAdsPillar,
  GoogleAdsPillar,
} from '../services/googleAdsPillar';
import { getWebsitePillar, WebsitePillar } from '../services/websitePillar';
import { getBrandPillar, BrandPillar } from '../services/brandPillar';
import { getSocialPillar, SocialPillar } from '../services/facebookSocialPillar';

const router = Router();

const CACHE_KEY = 'tenant_dashboard';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const DEFAULT_GOOGLE_ADS: GoogleAdsPillar = {
  connected: false,
  spend: 0,
  cpa: 0,
  roas: 0,
  conversions: 0,
  ctr: 0,
  clicks: 0,
  impressions: 0,
};
const DEFAULT_ADS = { spend: 0, cpa: 0, roas: 0, conversions: 0, ctr: 0, clicks: 0, impressions: 0, meta: { spend: 0, cpa: 0, roas: 0, conversions: 0, ctr: 0, clicks: 0, impressions: 0 }, linkedin: { spend: 0, cpa: 0, roas: 0, conversions: 0, ctr: 0, clicks: 0, impressions: 0 } };
const DEFAULT_WEBSITE: WebsitePillar = { connected: false };
const DEFAULT_BRAND: BrandPillar = { connected: false };
const DEFAULT_SOCIAL_PILLAR: SocialPillar = { connected: false };

async function fetchFreshDashboardData(tenantId: string) {
  // Fetch all sources in parallel — if one fails, others still return data
  const [websiteResult, adsResult, brandResult, metaAdsResult, socialResult, linkedinAdsResult] = await Promise.allSettled([
    getWebsitePillar(tenantId),
    getGoogleAdsPillar(tenantId),
    getBrandPillar(tenantId),
    getMetaAdsMetrics(tenantId),
    getSocialPillar(tenantId),
    getLinkedInAdsMetrics(tenantId),
  ]);

  let website: WebsitePillar = DEFAULT_WEBSITE;
  if (websiteResult.status === 'fulfilled') {
    website = websiteResult.value;
  } else {
    console.error('[dashboard] GA4 error for tenant', tenantId, ':', websiteResult.reason);
  }

  const googleAds: GoogleAdsPillar = adsResult.status === 'fulfilled'
    ? adsResult.value
    : (console.error('[dashboard] Google Ads error for tenant', tenantId, ':', (adsResult as PromiseRejectedResult).reason), DEFAULT_GOOGLE_ADS);

  const metaAds = metaAdsResult.status === 'fulfilled'
    ? metaAdsResult.value
    : (console.error('[dashboard] Meta Ads error for tenant', tenantId, ':', (metaAdsResult as PromiseRejectedResult).reason), DEFAULT_ADS.meta);

  const linkedinAds = linkedinAdsResult.status === 'fulfilled'
    ? linkedinAdsResult.value
    : (console.error('[dashboard] LinkedIn Ads error for tenant', tenantId, ':', (linkedinAdsResult as PromiseRejectedResult).reason), DEFAULT_ADS.linkedin);

  // Aggregate top-level totals across the platforms that are actually connected.
  // For Google (pillar shape) we use the `current` numbers when connected.
  const googleConnected = googleAds.connected === true;
  const gSpend = googleConnected ? googleAds.spend.current : 0;
  const gConversions = googleConnected ? googleAds.conversions.current : 0;
  const gConversionsValue = googleConnected
    ? googleAds.roas.current * googleAds.spend.current
    : 0;
  const gClicks = googleConnected ? googleAds.clicks.current : 0;
  const gImpressions = googleConnected ? googleAds.impressions.current : 0;

  const combinedSpend = gSpend + metaAds.spend + linkedinAds.spend;
  const combinedConversions =
    gConversions + metaAds.conversions + linkedinAds.conversions;
  const combinedClicks = gClicks + metaAds.clicks + linkedinAds.clicks;
  const combinedImpressions =
    gImpressions + metaAds.impressions + linkedinAds.impressions;
  const combinedConversionsValue =
    gConversionsValue +
    metaAds.roas * metaAds.spend +
    linkedinAds.roas * linkedinAds.spend;
  const combinedCpa =
    combinedConversions > 0 ? combinedSpend / combinedConversions : 0;
  const combinedRoas =
    combinedSpend > 0 ? combinedConversionsValue / combinedSpend : 0;
  const combinedCtr =
    combinedImpressions > 0 ? (combinedClicks / combinedImpressions) * 100 : 0;

  const ads = {
    spend: combinedSpend,
    cpa: combinedCpa,
    roas: combinedRoas,
    conversions: combinedConversions,
    ctr: combinedCtr,
    clicks: combinedClicks,
    impressions: combinedImpressions,
    google: googleAds,
    meta: metaAds,
    linkedin: linkedinAds,
  };

  let brand: BrandPillar = DEFAULT_BRAND;
  if (brandResult.status === 'fulfilled') {
    brand = brandResult.value;
  } else {
    console.error('[dashboard] Search Console error for tenant', tenantId, ':', brandResult.reason);
  }

  let social: SocialPillar = DEFAULT_SOCIAL_PILLAR;
  if (socialResult.status === 'fulfilled') {
    social = socialResult.value;
  } else {
    console.error('[dashboard] Social pillar error for tenant', tenantId, ':', socialResult.reason);
  }

  return { ads, website, brand, social };
}

async function writeDashboardCache(tenantId: string, data: object) {
  const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);
  await pool.query(
    `INSERT INTO tenant_cache (tenant_id, cache_key, data, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tenant_id, cache_key)
     DO UPDATE SET data = $3, expires_at = $4, created_at = NOW()`,
    [tenantId, CACHE_KEY, JSON.stringify(data), expiresAt]
  );
}

router.get('/', async (req: Request, res: Response) => {
  const tenantId = req.query.tenant_id as string;

  if (!tenantId) {
    return res.status(400).json({ error: 'tenant_id query parameter is required' });
  }

  // Check tenant cache first (24-hour outer cache covers ads / brand / social).
  // The website pillar has its own 1-hour cache, so we always re-fetch it and
  // overlay it on top of whatever the outer cache contains.
  try {
    const cached = await pool.query(
      `SELECT data, expires_at, (expires_at < NOW()) as is_expired
       FROM tenant_cache
       WHERE tenant_id = $1 AND cache_key = $2`,
      [tenantId, CACHE_KEY]
    );

    if (cached.rows.length > 0 && !cached.rows[0].is_expired) {
      console.log(`[dashboard] Serving cached data for tenant ${tenantId}`);
      const cachedData = cached.rows[0].data;
      const [websiteRes, brandRes, socialRes] = await Promise.allSettled([
        getWebsitePillar(tenantId),
        getBrandPillar(tenantId),
        getSocialPillar(tenantId),
      ]);
      const website: WebsitePillar =
        websiteRes.status === 'fulfilled' ? websiteRes.value : DEFAULT_WEBSITE;
      if (websiteRes.status === 'rejected') {
        console.error('[dashboard] Website pillar fetch error (cached path):', websiteRes.reason);
      }
      const brand: BrandPillar =
        brandRes.status === 'fulfilled' ? brandRes.value : DEFAULT_BRAND;
      if (brandRes.status === 'rejected') {
        console.error('[dashboard] Brand pillar fetch error (cached path):', brandRes.reason);
      }
      const social: SocialPillar =
        socialRes.status === 'fulfilled' ? socialRes.value : DEFAULT_SOCIAL_PILLAR;
      if (socialRes.status === 'rejected') {
        console.error('[dashboard] Social pillar fetch error (cached path):', socialRes.reason);
      }
      return res.json({ ...cachedData, website, brand, social });
    }
  } catch (err) {
    console.error('[dashboard] Cache read error:', err);
  }

  const response = await fetchFreshDashboardData(tenantId);

  // Cache result with 24-hour expiry
  try {
    await writeDashboardCache(tenantId, response);
  } catch (err) {
    console.error('[dashboard] Cache write error:', err);
  }

  return res.json(response);
});

router.get('/refresh', async (req: Request, res: Response) => {
  const tenantId = req.query.tenant_id as string;

  if (!tenantId) {
    return res.status(400).json({ error: 'tenant_id query parameter is required' });
  }

  // Delete cached entries so fresh data is fetched unconditionally.
  // This covers both the outer 24h dashboard cache and the 1h website pillar cache.
  try {
    await pool.query(
      `DELETE FROM tenant_cache
       WHERE tenant_id = $1 AND cache_key IN ($2, $3, $4, $5, $6)`,
      [
        tenantId,
        CACHE_KEY,
        `${tenantId}:dashboard:website`,
        `${tenantId}:dashboard:brand`,
        `${tenantId}:dashboard:social`,
        `${tenantId}:dashboard:ads:google`,
      ]
    );
    console.log(`[dashboard] Cleared cache for tenant ${tenantId}`);
  } catch (err) {
    console.error('[dashboard] Cache delete error:', err);
  }

  const response = await fetchFreshDashboardData(tenantId);

  // Re-populate cache with fresh data
  try {
    await writeDashboardCache(tenantId, response);
  } catch (err) {
    console.error('[dashboard] Cache write error:', err);
  }

  return res.json(response);
});

export default router;
