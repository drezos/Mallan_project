import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Loader2, WifiOff } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard'
import { useAnalyticsDashboard } from '../hooks/useAnalyticsDashboard'
import type { AnalyticsDashboardResponse } from '../lib/api'

export function Dashboard() {
  // Read tenant from URL query params (e.g., /dashboard?tenant=quicklets)
  const [searchParams] = useSearchParams();
  const tenant = searchParams.get('tenant') || undefined;

  const dashboardQuery = useDashboard(tenant);
  const analyticsQuery = useAnalyticsDashboard(tenant);

  const isLoading = dashboardQuery.isLoading;
  // Treat null API response as error (API returns null on fetch failure)
  const isError = dashboardQuery.isError || (dashboardQuery.isFetched && dashboardQuery.data === null);

  const refetch = () => {
    dashboardQuery.refetch();
    analyticsQuery.refetch();
  };

  // Get data from dashboard response
  const dashboardData = dashboardQuery.data?.data ?? undefined;

  // Loading state
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

  // Error state - show when API failed to load data
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
            onClick={() => refetch()}
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
    <div className="space-y-8">
      {/* Status indicator */}
      <div className="opacity-0 animate-fade-in flex items-center justify-end">
        <div className="flex items-center gap-3">
          {/* Last updated timestamp */}
          {dashboardData?.lastUpdated && (
            <div className="text-sm text-gray-500">
              Updated {formatRelativeTime(dashboardData.lastUpdated)}
            </div>
          )}

          {/* Connection status */}
          {isError ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Using cached data</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ===========================================
          ANALYTICS PILLARS
          =========================================== */}
      <section>
        <h2 className="text-lg font-display font-semibold text-slate-800 mb-4 opacity-0 animate-fade-in">
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <AdsPillar data={analyticsQuery.data?.ads} isLoading={analyticsQuery.isLoading} />
          <WebsitePillar data={analyticsQuery.data?.website} isLoading={analyticsQuery.isLoading} />
          <BrandPillar data={analyticsQuery.data?.brand} isLoading={analyticsQuery.isLoading} />
          <SocialPillar />
        </div>
      </section>
    </div>
  )
}

// ===========================================
// Analytics Pillar Components
// ===========================================

function PillarSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-slate-100 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

function AdsPillar({ data, isLoading }: { data?: AnalyticsDashboardResponse['ads']; isLoading: boolean }) {
  if (isLoading) return <PillarSkeleton />;
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
        Ads
      </h3>
      <div>
        <MetricRow label="Spend" value={data ? `€${data.spend.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'} />
        <MetricRow label="CPA" value={data ? `€${data.cpa.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'} />
        <MetricRow label="ROAS" value={data ? `${data.roas.toFixed(2)}x` : '—'} />
        <MetricRow label="Conversions" value={data ? data.conversions.toLocaleString('nl-NL') : '—'} />
        <MetricRow label="CTR" value={data ? `${data.ctr.toFixed(2)}%` : '—'} />
      </div>
    </div>
  );
}

function WebsitePillar({ data, isLoading }: { data?: AnalyticsDashboardResponse['website']; isLoading: boolean }) {
  if (isLoading) return <PillarSkeleton />;
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        Website
      </h3>
      <div>
        <MetricRow label="Sessions" value={data ? data.sessions.toLocaleString('nl-NL') : '—'} />
        <MetricRow label="Users" value={data ? data.users.toLocaleString('nl-NL') : '—'} />
        <MetricRow label="New Users" value={data ? data.newUsers.toLocaleString('nl-NL') : '—'} />
        <MetricRow label="Bounce Rate" value={data ? `${data.bounceRate.toFixed(1)}%` : '—'} />
      </div>
      {data && data.topSources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-2">Top Sources</p>
          {data.topSources.slice(0, 3).map(s => (
            <div key={s.source} className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-500 truncate max-w-[60%]">{s.source}</span>
              <span className="text-xs font-medium text-slate-700">{s.sessions.toLocaleString('nl-NL')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BrandPillar({ data, isLoading }: { data?: AnalyticsDashboardResponse['brand']; isLoading: boolean }) {
  if (isLoading) return <PillarSkeleton />;
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
        Brand Search
      </h3>
      <div>
        <MetricRow label="Impressions" value={data ? data.impressions.toLocaleString('nl-NL') : '—'} />
        <MetricRow label="Clicks" value={data ? data.clicks.toLocaleString('nl-NL') : '—'} />
        <MetricRow label="Avg. Position" value={data ? data.avgPosition.toFixed(1) : '—'} />
      </div>
      {data && data.topQueries.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-2">Top Queries</p>
          {data.topQueries.slice(0, 3).map((q: { query: string; clicks: number; impressions: number }) => (
            <div key={q.query} className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-500 truncate max-w-[60%]">{q.query}</span>
              <span className="text-xs font-medium text-slate-700">{q.clicks.toLocaleString('nl-NL')} clk</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialPillar() {
  return (
    <div className="card p-6 flex flex-col items-center justify-center text-center min-h-[160px]">
      <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
        Social
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        Connect Meta &amp; LinkedIn to see social data
      </p>
    </div>
  );
}

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

  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}
