import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { RefreshCw, Loader2, WifiOff, Star, Link2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useAnalyticsDashboard } from '../hooks/useAnalyticsDashboard';
import type { AnalyticsDashboardResponse, AdsPlatformMetrics, WebsitePillar, WebsiteMetric } from '../lib/api';

type PillarTab = 'ads' | 'social' | 'website' | 'brand';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function fmt(value: number | undefined | null, type: 'currency' | 'number' | 'percent'): string {
  if (value === undefined || value === null) return '—';
  switch (type) {
    case 'currency':
      return `€${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'number':
      return value.toLocaleString('nl-NL');
    case 'percent':
      return `${value.toFixed(2)}%`;
  }
}

function platformIsEmpty(p?: AdsPlatformMetrics): boolean {
  return !p || (p.spend === 0 && p.clicks === 0 && p.impressions === 0);
}

function socialIsEmpty(s?: AnalyticsDashboardResponse['social']): boolean {
  return !s || (s.reach === 0 && s.impressions === 0 && s.engagementRate === 0 && s.followerGrowth === 0);
}

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const tenant = searchParams.get('tenant') || undefined;
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<PillarTab>('ads');

  const dashboardQuery = useDashboard(tenant);
  const analyticsQuery = useAnalyticsDashboard(tenant);

  const isLoading = dashboardQuery.isLoading;
  const isError = dashboardQuery.isError || (dashboardQuery.isFetched && dashboardQuery.data === null);
  const refetch = () => { dashboardQuery.refetch(); analyticsQuery.refetch(); };

  const dashboardData = dashboardQuery.data?.data ?? undefined;
  const analytics = analyticsQuery.data as AnalyticsDashboardResponse | undefined;
  const firstName = user?.firstName ?? 'there';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-forest-500 mx-auto mb-3" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <WifiOff className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-2">Unable to load dashboard</p>
          <p className="text-slate-500 text-sm mb-4">
            {tenant ? `Could not load data for tenant "${tenant}"` : 'Could not connect to the server'}
          </p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-forest-500 text-white rounded-lg hover:bg-forest-600 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* A. Greeting Banner */}
      <div className="opacity-0 animate-fade-in flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-comfortaa font-bold text-brew-dark">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-slate-500 mt-1">Here's your espresso shot ☕</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
            Weekly
          </span>
          {dashboardData?.lastUpdated && (
            <span className="text-sm text-gray-500 hidden sm:inline">
              Updated {formatRelativeTime(dashboardData.lastUpdated)}
            </span>
          )}
          {isError ? (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm">
              <WifiOff className="w-4 h-4" />
              <span className="hidden sm:inline">Cached</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Live</span>
            </div>
          )}
          <button
            onClick={refetch}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* B. North Star Metric Cards */}
      <div
        className="grid grid-cols-2 xl:grid-cols-4 gap-4 opacity-0 animate-fade-in"
        style={{ animationDelay: '100ms' }}
      >
        <NorthStarCard
          label="Ads"
          sublabel="Total Spend"
          value={analytics?.ads ? fmt(analytics.ads.spend, 'currency') : '—'}
          color="blue"
          isLoading={analyticsQuery.isLoading}
        />
        <WebsiteNorthStarCard
          website={analytics?.website}
          isLoading={analyticsQuery.isLoading}
        />
        <NorthStarCard
          label="Brand"
          sublabel="Total Impressions"
          value={analytics?.brand ? fmt(analytics.brand.impressions, 'number') : '—'}
          color="violet"
          isLoading={analyticsQuery.isLoading}
        />
        <NorthStarCard
          label="Social"
          sublabel="Reach"
          value={analytics?.social?.reach ? fmt(analytics.social.reach, 'number') : '—'}
          color="pink"
          isLoading={analyticsQuery.isLoading}
        />
      </div>

      {/* C. Pillar Tab Bar + D. Tab Content */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex gap-1 border-b border-slate-200">
          {(['ads', 'social', 'website', 'brand'] as PillarTab[]).map(tab => {
            const labels: Record<PillarTab, string> = {
              ads: 'Ads',
              social: 'Social',
              website: 'Website',
              brand: 'Brand',
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-comfortaa font-semibold transition-all duration-150 border-b-2 -mb-px rounded-t-sm ${
                  activeTab === tab
                    ? 'border-brew-brown text-brew-brown'
                    : 'border-transparent text-slate-500 hover:text-brew-brown/70 hover:border-brew-brown/30 hover:bg-brew-brown/5'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {activeTab === 'ads' && (
            <AdsTabContent data={analytics} isLoading={analyticsQuery.isLoading} />
          )}
          {activeTab === 'social' && (
            <SocialTabContent data={analytics?.social} isLoading={analyticsQuery.isLoading} />
          )}
          {activeTab === 'website' && (
            <WebsiteTabContent data={analytics?.website} isLoading={analyticsQuery.isLoading} />
          )}
          {activeTab === 'brand' && (
            <BrandTabContent data={analytics?.brand} isLoading={analyticsQuery.isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// North Star Card
// ===========================================

function NorthStarCard({
  label,
  sublabel,
  value,
  color,
  isLoading,
}: {
  label: string;
  sublabel: string;
  value: string;
  color: 'blue' | 'emerald' | 'violet' | 'pink';
  isLoading: boolean;
}) {
  const dotColors = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    pink: 'bg-pink-400',
  };

  if (isLoading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-3 bg-slate-200 rounded w-1/2 mb-3" />
        <div className="h-3 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="h-7 bg-slate-200 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[color]}`} />
        <span className="text-xs font-comfortaa font-semibold text-brew-brown/70 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xs text-slate-400 mb-2">{sublabel}</p>
      <p className="text-2xl font-display font-bold text-brew-dark">{value}</p>
    </div>
  );
}

// ===========================================
// Shared helpers
// ===========================================

function MetricCell({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-slate-400 mb-1">
        <Star className="w-2.5 h-2.5 text-brew-orange/30 flex-shrink-0" aria-hidden="true" />
        {label}
      </p>
      <p className={`font-semibold text-brew-dark ${small ? 'text-sm' : 'text-lg font-display'}`}>{value}</p>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="card p-6 animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-1/4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
            <div className="h-6 bg-slate-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================
// Ads Tab
// ===========================================

function AdsTabContent({
  data,
  isLoading,
}: {
  data?: AnalyticsDashboardResponse;
  isLoading: boolean;
}) {
  if (isLoading) return <TabSkeleton />;

  const ads = data?.ads;

  return (
    <div className="space-y-6">
      {/* Combined totals */}
      <div className="card p-6">
        <h3 className="text-sm font-comfortaa font-semibold text-brew-dark mb-4">Combined Totals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <MetricCell label="Spend" value={ads ? fmt(ads.spend, 'currency') : '—'} />
          <MetricCell label="CPA" value={ads ? fmt(ads.cpa, 'currency') : '—'} />
          <MetricCell label="ROAS" value={ads ? `${ads.roas.toFixed(2)}x` : '—'} />
          <MetricCell label="CTR" value={ads ? fmt(ads.ctr, 'percent') : '—'} />
          <MetricCell label="Conversions" value={ads ? fmt(ads.conversions, 'number') : '—'} />
        </div>
      </div>

      {/* Per-platform breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-comfortaa font-semibold text-brew-dark">Platform Breakdown</h3>
        <PlatformRow name="Google Ads" platform={ads?.google} />
        <PlatformRow name="Meta Ads" platform={ads?.meta} />
        <PlatformRow name="LinkedIn Ads" platform={ads?.linkedin} />
      </div>
    </div>
  );
}

function PlatformRow({
  name,
  platform,
}: {
  name: string;
  platform?: AdsPlatformMetrics;
}) {
  if (platformIsEmpty(platform)) {
    return (
      <div className="card p-4 flex items-center justify-between border-dashed">
        <span className="text-sm font-medium text-slate-400">{name}</span>
        <div className="flex items-center gap-1.5 text-xs text-brew-orange/60">
          <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Connect {name} to unlock data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <p className="text-sm font-semibold text-slate-700 mb-3">{name}</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCell label="Spend" value={fmt(platform!.spend, 'currency')} small />
        <MetricCell label="CPA" value={fmt(platform!.cpa, 'currency')} small />
        <MetricCell label="ROAS" value={`${platform!.roas.toFixed(2)}x`} small />
        <MetricCell label="CTR" value={fmt(platform!.ctr, 'percent')} small />
        <MetricCell label="Conversions" value={fmt(platform!.conversions, 'number')} small />
      </div>
    </div>
  );
}

// ===========================================
// Social Tab
// ===========================================

function SocialTabContent({
  data,
  isLoading,
}: {
  data?: AnalyticsDashboardResponse['social'];
  isLoading: boolean;
}) {
  if (isLoading) return <TabSkeleton />;

  if (socialIsEmpty(data)) {
    return (
      <div className="card p-10 flex flex-col items-center justify-center text-center border-dashed">
        <div className="w-12 h-12 bg-brew-orange/10 rounded-full flex items-center justify-center mb-4">
          <Link2 className="w-5 h-5 text-brew-orange/50" aria-hidden="true" />
        </div>
        <p className="text-brew-dark/60 font-comfortaa font-semibold mb-1">Connect Meta to see your social data</p>
        <p className="text-slate-400 text-sm">Once connected, you'll see reach, impressions, and more.</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-sm font-comfortaa font-semibold text-brew-dark mb-4">Social Overview</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCell label="Reach" value={fmt(data!.reach, 'number')} />
        <MetricCell label="Impressions" value={fmt(data!.impressions, 'number')} />
        <MetricCell label="Engagement Rate" value={`${data!.engagementRate?.toFixed(2) ?? '—'}%`} />
        <MetricCell label="Follower Growth" value={fmt(data!.followerGrowth, 'number')} />
      </div>
    </div>
  );
}

// ===========================================
// Website — shared helpers + North Star
// ===========================================

function ChangeBadge({ change, invert = false }: { change: number; invert?: boolean }) {
  // invert=true for metrics where a decrease is good (e.g. bounceRate)
  const effective = invert ? -change : change;
  const isPositive = effective > 0;
  const isNegative = effective < 0;
  const isNeutral = !isPositive && !isNegative;
  const color = isNeutral
    ? 'text-slate-400 bg-slate-50'
    : isPositive
      ? 'text-emerald-600 bg-emerald-50'
      : 'text-rose-600 bg-rose-50';
  const Icon = isNegative ? ArrowDownRight : ArrowUpRight;
  const sign = change > 0 ? '+' : '';
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
      {!isNeutral && <Icon className="w-3 h-3" aria-hidden="true" />}
      {sign}{change.toFixed(1)}%
    </span>
  );
}

function WebsiteNorthStarCard({
  website,
  isLoading,
}: {
  website?: WebsitePillar;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-3 bg-slate-200 rounded w-1/2 mb-3" />
        <div className="h-3 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="h-7 bg-slate-200 rounded w-3/4" />
      </div>
    );
  }

  const connected = website?.connected === true;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-500" />
        <span className="text-xs font-comfortaa font-semibold text-brew-brown/70 uppercase tracking-wide">
          Website
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-2">Sessions</p>
      {connected ? (
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-2xl font-display font-bold text-brew-dark">
            {fmt(website!.metrics.sessions.current, 'number')}
          </p>
          <ChangeBadge change={website!.metrics.sessions.change} />
        </div>
      ) : (
        <Link
          to="/connections"
          className="inline-flex items-center gap-1.5 text-sm text-brew-orange hover:text-brew-orange/80 mt-1"
        >
          <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
          Connect Google to see website data
        </Link>
      )}
    </div>
  );
}

// ===========================================
// Website Tab
// ===========================================

function WebsiteMetricCell({
  label,
  metric,
  format,
  invertChange = false,
}: {
  label: string;
  metric: WebsiteMetric;
  format: (v: number) => string;
  invertChange?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-slate-400 mb-1">
        <Star className="w-2.5 h-2.5 text-brew-orange/30 flex-shrink-0" aria-hidden="true" />
        {label}
      </p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-lg font-display font-semibold text-brew-dark">{format(metric.current)}</p>
        <ChangeBadge change={metric.change} invert={invertChange} />
      </div>
      <p className="text-xs text-slate-400 mt-0.5">
        Prev: {format(metric.previous)}
      </p>
    </div>
  );
}

function WebsiteTabContent({
  data,
  isLoading,
}: {
  data?: WebsitePillar;
  isLoading: boolean;
}) {
  if (isLoading) return <TabSkeleton />;

  if (!data || data.connected === false) {
    return (
      <div className="card p-10 flex flex-col items-center justify-center text-center border-dashed">
        <div className="w-12 h-12 bg-brew-orange/10 rounded-full flex items-center justify-center mb-4">
          <Link2 className="w-5 h-5 text-brew-orange/50" aria-hidden="true" />
        </div>
        <p className="text-brew-dark/60 font-comfortaa font-semibold mb-1">
          Connect Google to see website data
        </p>
        <p className="text-slate-400 text-sm mb-4">
          Once connected, we'll pull sessions, users, and traffic sources from GA4.
        </p>
        <Link
          to="/connections"
          className="px-4 py-2 bg-forest-500 text-white rounded-lg hover:bg-forest-600 transition-colors text-sm inline-flex items-center gap-2"
        >
          <Link2 className="w-4 h-4" aria-hidden="true" />
          Go to Connections
        </Link>
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-comfortaa font-semibold text-brew-dark">
            Website Overview
          </h3>
          {data.propertyName && (
            <p className="text-xs text-slate-400">
              GA4: <span className="text-slate-500">{data.propertyName}</span> · Last 7 days vs previous 7 days
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <WebsiteMetricCell
            label="Sessions"
            metric={m.sessions}
            format={(v) => fmt(v, 'number')}
          />
          <WebsiteMetricCell
            label="New Users"
            metric={m.newUsers}
            format={(v) => fmt(v, 'number')}
          />
          <WebsiteMetricCell
            label="Bounce Rate"
            metric={m.bounceRate}
            format={(v) => `${v.toFixed(1)}%`}
            invertChange
          />
          <WebsiteMetricCell
            label="Engagement Rate"
            metric={m.engagementRate}
            format={(v) => `${v.toFixed(1)}%`}
          />
        </div>
      </div>

      {data.topSources.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-comfortaa font-semibold text-brew-dark mb-4">
            Top Traffic Sources
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-2 font-medium">Source</th>
                  <th className="text-right pb-2 font-medium">Sessions</th>
                  <th className="text-right pb-2 font-medium">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const total = data.topSources.reduce((sum, s) => sum + s.sessions, 0) || 1;
                  return data.topSources.map((s) => {
                    const pct = ((s.sessions / total) * 100).toFixed(1);
                    return (
                      <tr key={s.source} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 text-slate-600 truncate max-w-[200px]">{s.source}</td>
                        <td className="py-2.5 text-right font-medium text-slate-800">
                          {s.sessions.toLocaleString('nl-NL')}
                        </td>
                        <td className="py-2.5 text-right text-slate-500">{pct}%</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// Brand Tab
// ===========================================

function BrandTabContent({
  data,
  isLoading,
}: {
  data?: AnalyticsDashboardResponse['brand'];
  isLoading: boolean;
}) {
  if (isLoading) return <TabSkeleton />;

  const ctr =
    data && data.impressions > 0
      ? `${((data.clicks / data.impressions) * 100).toFixed(2)}%`
      : '—';

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="text-sm font-comfortaa font-semibold text-brew-dark mb-4">Brand Search Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCell label="Total Impressions" value={data ? fmt(data.impressions, 'number') : '—'} />
          <MetricCell label="Total Clicks" value={data ? fmt(data.clicks, 'number') : '—'} />
          <MetricCell label="Average Position" value={data ? data.avgPosition.toFixed(1) : '—'} />
          <MetricCell label="CTR" value={ctr} />
        </div>
      </div>

      {data && data.topQueries.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-comfortaa font-semibold text-brew-dark mb-4">Top Search Queries</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-2 font-medium">Query</th>
                  <th className="text-right pb-2 font-medium">Clicks</th>
                  <th className="text-right pb-2 font-medium">Impressions</th>
                  <th className="text-right pb-2 font-medium">CTR</th>
                  <th className="text-right pb-2 font-medium">Position</th>
                </tr>
              </thead>
              <tbody>
                {data.topQueries.map(q => {
                  const queryCtr =
                    q.impressions > 0
                      ? `${((q.clicks / q.impressions) * 100).toFixed(2)}%`
                      : '—';
                  return (
                    <tr key={q.query} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 text-slate-600 truncate max-w-[200px]">{q.query}</td>
                      <td className="py-2.5 text-right font-medium text-slate-800">
                        {q.clicks.toLocaleString('nl-NL')}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {q.impressions.toLocaleString('nl-NL')}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">{queryCtr}</td>
                      <td className="py-2.5 text-right text-slate-500">
                        {q.position != null ? q.position.toFixed(1) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// Utility
// ===========================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}
