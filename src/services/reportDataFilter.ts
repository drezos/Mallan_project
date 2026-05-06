import { GoogleAdsPillar, GoogleAdsPillarConnected } from './googleAdsPillar';
import { MetaAdsMetrics } from './metaAdsClient';
import { LinkedInAdsMetrics } from './linkedinAdsClient';
import { WebsitePillar, WebsitePillarConnected } from './websitePillar';
import { BrandPillar, BrandPillarConnected, BrandTopQuery } from './brandPillar';
import { SocialPillar, SocialPillarConnected } from './facebookSocialPillar';

export type ReportType = 'finance' | 'leadership' | 'sales' | 'internal';

// Shape of the aggregated ads section returned by the dashboard route
export interface DashboardAds {
  spend: number;
  cpa: number;
  roas: number;
  conversions: number;
  ctr: number;
  clicks: number;
  impressions: number;
  google: GoogleAdsPillar;
  meta: MetaAdsMetrics;
  linkedin: LinkedInAdsMetrics;
}

// Full dashboard data shape as returned by GET /dashboard
export interface DashboardData {
  ads: DashboardAds;
  website: WebsitePillar;
  brand: BrandPillar;
  social: SocialPillar;
}

// ─── Per-report output types ─────────────────────────────────────────────────

export interface PlatformSpend {
  platform: string;
  spend: number;
}

export interface FinanceReportData {
  reportType: 'finance';
  totalSpend: number;
  cpa: number;
  totalConversions: number;
  /** null when monthlyAdBudget is not set */
  budgetUsedPercent: number | null;
  platformBreakdown: PlatformSpend[];
}

export interface ChannelBreakdownRow {
  channel: string;
  spend: number;
  conversions: number;
  costPerConversion: number;
}

export interface LeadershipReportData {
  reportType: 'leadership';
  totalConversions: number;
  costPerConversion: number;
  topChannelByConversions: string;
  /** Week-over-week conversions change in percent; null when no WoW data available */
  wowConversionsChange: number | null;
  channelBreakdown: ChannelBreakdownRow[];
}

export interface LeadsBySourceRow {
  source: string;
  sessions: number;
}

export interface SalesReportData {
  reportType: 'sales';
  /** true when GA4 has no goal completions configured */
  noGoalsConfigured: boolean;
  totalLeads: number;
  topLeadSource: string | null;
  sourceCount: number;
  /** Week-over-week lead change in percent; null when not available */
  wowLeadChange: number | null;
  leadsBySource: LeadsBySourceRow[];
}

export interface InternalAdsSummary {
  totalSpend: number;
  totalConversions: number;
  cpa: number;
  roas: number;
  ctr: number;
  platformBreakdown: PlatformSpend[];
}

export interface InternalWebsiteSummary {
  connected: boolean;
  sessions: number | null;
  newUsers: number | null;
  bounceRate: number | null;
  engagementRate: number | null;
  topSources: Array<{ source: string; sessions: number }>;
}

export interface InternalBrandSummary {
  connected: boolean;
  impressions: number | null;
  clicks: number | null;
  avgPosition: number | null;
  ctr: number | null;
}

export interface InternalSocialSummary {
  connected: boolean;
  reach: number | null;
  impressions: number | null;
  engagementRate: number | null;
}

export interface InternalReportData {
  reportType: 'internal';
  adsSummary: InternalAdsSummary;
  websiteSummary: InternalWebsiteSummary;
  brandSummary: InternalBrandSummary;
  socialSummary: InternalSocialSummary;
  /** Top 5 search queries from Search Console; empty array when brand disconnected */
  topSearchQueries: BrandTopQuery[];
  /** Not yet available in dashboard data — reserved for future enrichment */
  topCampaignsBySpend: null;
  topPostsPerPlatform: null;
  topLandingPages: null;
}

export type ReportData =
  | FinanceReportData
  | LeadershipReportData
  | SalesReportData
  | InternalReportData;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function googleConnected(g: GoogleAdsPillar): g is GoogleAdsPillarConnected {
  return g.connected === true;
}

function websiteConnected(w: WebsitePillar): w is WebsitePillarConnected {
  return w.connected === true;
}

function brandConnected(b: BrandPillar): b is BrandPillarConnected {
  return b.connected === true;
}

function socialConnected(s: SocialPillar): s is SocialPillarConnected {
  return s.connected === true;
}

function platformSpendBreakdown(ads: DashboardAds): PlatformSpend[] {
  const breakdown: PlatformSpend[] = [];
  if (googleConnected(ads.google)) {
    breakdown.push({ platform: 'Google Ads', spend: ads.google.spend.current });
  } else if (ads.google.spend > 0) {
    breakdown.push({ platform: 'Google Ads', spend: ads.google.spend as number });
  }
  if (ads.meta.spend > 0) {
    breakdown.push({ platform: 'Meta Ads', spend: ads.meta.spend });
  }
  if (ads.linkedin.spend > 0) {
    breakdown.push({ platform: 'LinkedIn Ads', spend: ads.linkedin.spend });
  }
  return breakdown;
}

function channelBreakdown(ads: DashboardAds): ChannelBreakdownRow[] {
  const rows: ChannelBreakdownRow[] = [];

  if (googleConnected(ads.google)) {
    const spend = ads.google.spend.current;
    const conversions = ads.google.conversions.current;
    rows.push({
      channel: 'Google Ads',
      spend,
      conversions,
      costPerConversion: conversions > 0 ? spend / conversions : 0,
    });
  }

  if (ads.meta.spend > 0 || ads.meta.conversions > 0) {
    rows.push({
      channel: 'Meta Ads',
      spend: ads.meta.spend,
      conversions: ads.meta.conversions,
      costPerConversion:
        ads.meta.conversions > 0 ? ads.meta.spend / ads.meta.conversions : 0,
    });
  }

  if (ads.linkedin.spend > 0 || ads.linkedin.conversions > 0) {
    rows.push({
      channel: 'LinkedIn Ads',
      spend: ads.linkedin.spend,
      conversions: ads.linkedin.conversions,
      costPerConversion:
        ads.linkedin.conversions > 0 ? ads.linkedin.spend / ads.linkedin.conversions : 0,
    });
  }

  return rows;
}

// ─── Per-report filter functions ─────────────────────────────────────────────

function filterFinance(
  ads: DashboardAds,
  monthlyAdBudget: number | null
): FinanceReportData {
  const budgetUsedPercent =
    monthlyAdBudget !== null && monthlyAdBudget > 0
      ? Math.round((ads.spend / monthlyAdBudget) * 10000) / 100
      : null;

  return {
    reportType: 'finance',
    totalSpend: ads.spend,
    cpa: ads.cpa,
    totalConversions: ads.conversions,
    budgetUsedPercent,
    platformBreakdown: platformSpendBreakdown(ads),
  };
}

function filterLeadership(ads: DashboardAds): LeadershipReportData {
  const breakdown = channelBreakdown(ads);

  const topRow = breakdown.reduce<ChannelBreakdownRow | null>((best, row) => {
    if (!best || row.conversions > best.conversions) return row;
    return best;
  }, null);

  // WoW change is only available from Google Ads (pillar shape); others are flat
  let wowConversionsChange: number | null = null;
  if (googleConnected(ads.google)) {
    wowConversionsChange = ads.google.conversions.change;
  }

  return {
    reportType: 'leadership',
    totalConversions: ads.conversions,
    costPerConversion: ads.cpa,
    topChannelByConversions: topRow?.channel ?? 'N/A',
    wowConversionsChange,
    channelBreakdown: breakdown,
  };
}

function filterSales(website: WebsitePillar): SalesReportData {
  // GA4 goal completions are not yet surfaced in the WebsitePillar — mark as
  // unconfigured until the dashboard is extended with a conversions array.
  if (!websiteConnected(website)) {
    return {
      reportType: 'sales',
      noGoalsConfigured: true,
      totalLeads: 0,
      topLeadSource: null,
      sourceCount: 0,
      wowLeadChange: null,
      leadsBySource: [],
    };
  }

  const sources = website.topSources;
  const noGoalsConfigured = sources.length === 0;
  const totalLeads = sources.reduce((sum, s) => sum + s.sessions, 0);
  const topSource = sources[0] ?? null;

  // WoW sessions change as a proxy for lead change when sessions are available
  const wowLeadChange = website.metrics.sessions.change ?? null;

  return {
    reportType: 'sales',
    noGoalsConfigured,
    totalLeads,
    topLeadSource: topSource?.source ?? null,
    sourceCount: sources.length,
    wowLeadChange,
    leadsBySource: sources.map((s) => ({ source: s.source, sessions: s.sessions })),
  };
}

function filterInternal(
  ads: DashboardAds,
  website: WebsitePillar,
  brand: BrandPillar,
  social: SocialPillar
): InternalReportData {
  const adsSummary: InternalAdsSummary = {
    totalSpend: ads.spend,
    totalConversions: ads.conversions,
    cpa: ads.cpa,
    roas: ads.roas,
    ctr: ads.ctr,
    platformBreakdown: platformSpendBreakdown(ads),
  };

  const websiteConnected_ = websiteConnected(website);
  const websiteSummary: InternalWebsiteSummary = {
    connected: websiteConnected_,
    sessions: websiteConnected_ ? website.metrics.sessions.current : null,
    newUsers: websiteConnected_ ? website.metrics.newUsers.current : null,
    bounceRate: websiteConnected_ ? website.metrics.bounceRate.current : null,
    engagementRate: websiteConnected_ ? website.metrics.engagementRate.current : null,
    topSources: websiteConnected_ ? website.topSources : [],
  };

  const brandConnected_ = brandConnected(brand);
  const brandSummary: InternalBrandSummary = {
    connected: brandConnected_,
    impressions: brandConnected_ ? brand.metrics.impressions.current : null,
    clicks: brandConnected_ ? brand.metrics.clicks.current : null,
    avgPosition: brandConnected_ ? brand.metrics.avgPosition.current : null,
    ctr: brandConnected_ ? brand.metrics.ctr.current : null,
  };

  const socialConnected_ = socialConnected(social);
  const socialSummary: InternalSocialSummary = {
    connected: socialConnected_,
    reach: socialConnected_ ? social.reach.current : null,
    impressions: socialConnected_ ? social.impressions.current : null,
    engagementRate: socialConnected_ ? social.engagementRate.current : null,
  };

  const topSearchQueries = brandConnected_ ? brand.topQueries : [];

  return {
    reportType: 'internal',
    adsSummary,
    websiteSummary,
    brandSummary,
    socialSummary,
    topSearchQueries,
    topCampaignsBySpend: null,
    topPostsPerPlatform: null,
    topLandingPages: null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function filterDataForReport(
  dashboardData: DashboardData,
  reportType: ReportType,
  monthlyAdBudget: number | null
): ReportData {
  switch (reportType) {
    case 'finance':
      return filterFinance(dashboardData.ads, monthlyAdBudget);
    case 'leadership':
      return filterLeadership(dashboardData.ads);
    case 'sales':
      return filterSales(dashboardData.website);
    case 'internal':
      return filterInternal(
        dashboardData.ads,
        dashboardData.website,
        dashboardData.brand,
        dashboardData.social
      );
  }
}
