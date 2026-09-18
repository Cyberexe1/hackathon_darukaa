interface AnalyticsCardProps {
  label: string;
  value: string;
  icon: string;
  trend?: { direction: 'up' | 'down'; value: string };
}

/** Compact aggregate stat card used on the global /analytics overview page. */
export function AnalyticsCard({ label, value, icon, trend }: AnalyticsCardProps) {
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-space-sm">
        <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
          {label}
        </span>
        <div className="w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>
      <div className="font-headline-lg text-headline-lg text-primary leading-none mb-1">
        {value}
      </div>
      {trend && (
        <span
          className={`inline-flex items-center gap-1 font-label-technical text-label-micro font-semibold ${
            trend.direction === 'up' ? 'text-surface-tint' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            {trend.direction === 'up' ? 'trending_up' : 'trending_down'}
          </span>
          {trend.value}
        </span>
      )}
    </div>
  );
}
