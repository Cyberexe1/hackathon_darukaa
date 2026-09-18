import type { AnalyticsTimeRange } from '../../types/dashboard';

const OPTIONS: { value: AnalyticsTimeRange; label: string }[] = [
  { value: '1y', label: '1 Year' },
  { value: '3y', label: '3 Years' },
  { value: '5y', label: '5 Years' },
  { value: 'all', label: 'All Time' },
];

interface TimeRangeFilterProps {
  value: AnalyticsTimeRange;
  onChange: (value: AnalyticsTimeRange) => void;
  label?: string;
}

/**
 * Shared "Time Range" dropdown filter used on both the Site Analytics
 * page and the global Analytics page. Filtering happens client-side
 * against already-fetched historical data (cheap — a handful of yearly
 * points), so changing this never triggers a full page reload or a new
 * network request. See `utils/timeRange.ts` for the filtering logic.
 */
export function TimeRangeFilter({ value, onChange, label = 'Time Range' }: TimeRangeFilterProps) {
  return (
    <div className="flex items-center gap-space-sm">
      <label
        htmlFor="time-range-filter"
        className="font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap"
      >
        {label}
      </label>
      <select
        id="time-range-filter"
        value={value}
        onChange={(e) => onChange(e.target.value as AnalyticsTimeRange)}
        className="rounded-lg border border-outline-variant px-space-md py-space-xs font-body-sm text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
