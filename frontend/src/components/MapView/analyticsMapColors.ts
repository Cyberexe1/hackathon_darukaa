import type { AnalyticsMapMode } from '../../store/mapStore';

export const ANALYTICS_MODE_LABELS: Record<AnalyticsMapMode, string> = {
  none: 'None',
  carbon: 'Carbon Impact',
  biodiversity: 'Biodiversity Score',
  vegetation: 'Vegetation Index',
  treeCover: 'Tree Cover %',
};

/** Low->high fill colors per metric, matching each metric's chart color
 * elsewhere in the app (see components/charts/chartTheme.ts) so the map
 * and charts read as the same visual language. */
export const ANALYTICS_MODE_COLORS: Record<
  Exclude<AnalyticsMapMode, 'none'>,
  { low: string; high: string }
> = {
  carbon: { low: '#d7e6dc', high: '#12372a' },
  biodiversity: { low: '#dbe8de', high: '#416656' },
  vegetation: { low: '#d7f5e7', high: '#10b981' },
  treeCover: { low: '#d3eef5', high: '#00a7c3' },
};
