interface AnalyticsCardProps {
  label: string;
  value: string;
  icon: string;
  trend?: { direction: 'up' | 'down'; value: string };
}

/** Compact aggregate stat card used on the global /analytics overview page. */
export function AnalyticsCard({ label, value, icon, trend }: AnalyticsCardProps) {
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-space-sm mb-space-sm">
        {/* Font sizes on this card are 25% smaller than the shared
            `label-technical`/`headline-sm`/`headline-lg` tokens
            (0.75rem/1.125rem/2.25rem) — set as explicit arbitrary sizes
            here rather than changing those tokens themselves, which are
            reused for headings/buttons across the rest of the app. */}
        <span className="font-label-technical text-[9px] leading-[1.35] tracking-[0.06em] text-on-surface-variant uppercase truncate">
          {label}
        </span>
        <div className="w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>
      <div className="font-headline-sm text-[13.5px] md:text-[27px] text-primary leading-tight mb-1 break-words">
        {value}
      </div>
      {trend && (
        <span
          className={`inline-flex items-center gap-1 font-label-technical text-[8.25px] leading-[1.2] tracking-[0.08em] font-semibold ${
            trend.direction === 'up' ? 'text-surface-tint' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[11px]" aria-hidden="true">
            {trend.direction === 'up' ? 'trending_up' : 'trending_down'}
          </span>
          {trend.value}
        </span>
      )}
    </div>
  );
}
