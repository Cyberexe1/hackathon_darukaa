import type { PerformanceSummary } from '../../types/dashboard';

interface PerformanceSummaryCardProps {
  summary: PerformanceSummary;
}

function TrendRow({ label, changePct }: { label: string; changePct: number }) {
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
 * "Environmental Performance" summary card shown on the Site Analytics
 * page — subtle, professional trend indicators rather than bold claims.
 */
export function PerformanceSummaryCard({ summary }: PerformanceSummaryCardProps) {
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-space-sm">
        <h3 className="font-headline-sm text-headline-sm text-primary">Environmental Performance</h3>
        <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">Demo data</span>
      </div>
      <div className="divide-y divide-outline-variant/20">
        <TrendRow label="Carbon" changePct={summary.carbon_change_pct} />
        <TrendRow label="Biodiversity" changePct={summary.biodiversity_change_pct} />
        <TrendRow label="Vegetation" changePct={summary.vegetation_change_pct} />
        <div className="flex items-center justify-between py-space-sm">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Area</span>
          <span className="font-headline-sm text-headline-sm text-primary">{summary.area_hectares.toLocaleString()} ha</span>
        </div>
      </div>
    </div>
  );
}
