import type { PerformanceChange, SiteAnalyticsSummary } from '../../types/dashboard';

interface PerformanceSummaryCardProps {
  performance: PerformanceChange;
  summary: SiteAnalyticsSummary;
}

function TrendRow({ label, changePct }: { label: string; changePct: number | null }) {
  if (changePct === null) {
    return (
      <div className="flex items-center justify-between py-space-sm border-b border-outline-variant/20 last:border-0">
        <span className="font-body-sm text-body-sm text-on-surface-variant">{label}</span>
        <span className="font-label-technical text-label-micro text-on-surface-variant">
          Insufficient historical data
        </span>
      </div>
    );
  }

  const isPositive = changePct >= 0;
  return (
    <div className="flex items-center justify-between py-space-sm border-b border-outline-variant/20 last:border-0">
      <span className="font-body-sm text-body-sm text-on-surface-variant">{label}</span>
      <span
        className={`inline-flex items-center gap-1 font-label-technical text-label-micro font-semibold ${
          isPositive ? 'text-surface-tint' : 'text-on-surface-variant'
        }`}
      >
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          {isPositive ? 'trending_up' : 'trending_down'}
        </span>
        {isPositive ? '+' : ''}
        {changePct}%
      </span>
    </div>
  );
}

/**
 * "Performance Overview" summary card shown on the Site Analytics page.
 * Percent changes are computed server-side from real stored measurements
 * (earliest vs. latest recorded value) — never fabricated. When fewer
 * than two measurements exist, each row shows "Insufficient historical
 * data" instead of a percentage.
 */
export function PerformanceSummaryCard({ performance, summary }: PerformanceSummaryCardProps) {
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-space-sm">
        <h3 className="font-headline-sm text-headline-sm text-primary">Performance Overview</h3>
        {summary.first_recorded_at && summary.last_recorded_at && (
          <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
            {new Date(summary.first_recorded_at).getFullYear()} &mdash;{' '}
            {new Date(summary.last_recorded_at).getFullYear()}
          </span>
        )}
      </div>
      <div className="divide-y divide-outline-variant/20">
        <TrendRow label="Carbon" changePct={performance.carbon_change_pct} />
        <TrendRow label="Biodiversity" changePct={performance.biodiversity_change_pct} />
        <TrendRow label="Vegetation" changePct={performance.vegetation_change_pct} />
        <TrendRow label="Tree Cover" changePct={performance.tree_cover_change_pct} />
      </div>
    </div>
  );
}
