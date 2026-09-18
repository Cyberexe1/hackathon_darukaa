import { useCountUp } from '../../hooks/useCountUp';

interface KpiCardProps {
  icon: string;
  label: string;
  /** Numeric value to animate from 0. Ignored if `staticValue` is provided. */
  target?: number;
  /** Value formatting applied after counting (e.g. thousands separators, units). */
  formatValue?: (value: number) => string;
  /** Use for values that shouldn't count up (e.g. already a compact string like "18.4K"). */
  staticValue?: string;
  suffix?: string;
  description?: string;
  tone?: 'default' | 'accent';
}

/**
 * Primary KPI card used on the dashboard overview. Animates its number
 * from 0 to `target` the first time it scrolls into view, matching the
 * counter behaviour already used in the landing page hero.
 */
export function KpiCard({
  icon,
  label,
  target,
  formatValue,
  staticValue,
  suffix = '',
  description,
  tone = 'default',
}: KpiCardProps) {
  const { ref, value } = useCountUp<HTMLDivElement>({ target: target ?? 0, triggerOnView: true });
  const displayValue =
    staticValue ?? `${formatValue ? formatValue(value) : value.toLocaleString()}${suffix}`;

  return (
    <div
      ref={ref}
      className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-space-md">
        <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
          {label}
        </span>
        <div className="w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>
      <div
        className={`font-headline-lg text-headline-lg leading-none ${tone === 'accent' ? 'text-surface-tint' : 'text-primary'}`}
      >
        {displayValue}
      </div>
      {description && (
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
          {description}
        </p>
      )}
    </div>
  );
}

interface CompactKpiCardProps {
  label: string;
  value: string;
  icon: string;
}

/** Compact secondary-row KPI card (biodiversity, vegetation, active sites, etc). */
export function CompactKpiCard({ label, value, icon }: CompactKpiCardProps) {
  return (
    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
      <div className="w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <div className="font-label-technical text-label-micro text-on-surface-variant uppercase truncate">
          {label}
        </div>
        <div className="font-headline-sm text-headline-sm text-primary">{value}</div>
      </div>
    </div>
  );
}
