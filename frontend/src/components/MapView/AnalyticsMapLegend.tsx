import type { AnalyticsMapMode } from '../../store/mapStore';
import { ANALYTICS_MODE_COLORS, ANALYTICS_MODE_LABELS } from './analyticsMapColors';

interface AnalyticsMapLegendProps {
  mode: Exclude<AnalyticsMapMode, 'none'>;
}

/**
 * Compact legend shown when the map's analytics visualization mode is
 * active. Deliberately labeled "Low/Medium/High" relative intensity
 * rather than absolute units or a calibrated scale — this shades the
 * stored dataset for product visualization purposes, not a scientific or
 * satellite-derived measurement.
 */
export function AnalyticsMapLegend({ mode }: AnalyticsMapLegendProps) {
  const color = ANALYTICS_MODE_COLORS[mode];
  return (
    <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-md p-space-sm">
      <p className="font-label-technical text-label-micro text-on-surface-variant uppercase mb-space-xs">
        {ANALYTICS_MODE_LABELS[mode]}
      </p>
      <div className="flex items-center gap-space-xs">
        <span className="font-label-technical text-label-micro text-on-surface-variant">Low</span>
        <div
          className="w-16 h-2 rounded-full"
          style={{ background: `linear-gradient(to right, ${color.low}, ${color.high})` }}
          aria-hidden="true"
        />
        <span className="font-label-technical text-label-micro text-on-surface-variant">High</span>
      </div>
    </div>
  );
}
