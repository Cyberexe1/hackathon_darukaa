import type { SiteMetric, YearAggregatePoint } from '../types/dashboard';

/**
 * Client-side year-bucket aggregation across multiple sites' historical
 * metric records (sum for carbon, average for the rest) — the same
 * aggregation the backend performs for a single project/dashboard scope
 * (see backend/app/services/analytics_service.py::_year_aggregates_for_site_ids),
 * but for an arbitrary ad-hoc filter combination (project + region + type)
 * that has no single matching backend endpoint. The inputs are already
 * fetched, small (a handful of yearly points per site), and filtered
 * client-side by the user's selections — this keeps the same
 * backend-computed *values* (nothing here fabricates a measurement) while
 * combining them for a filter combination the API doesn't expose directly.
 */
export function aggregateMetricsByYear(allHistorical: SiteMetric[][]): YearAggregatePoint[] {
  const byYear = new Map<number, { carbon: number; bioSum: number; bioCount: number; vegSum: number; vegCount: number; treeSum: number; treeCount: number }>();

  for (const series of allHistorical) {
    for (const metric of series) {
      const year = new Date(metric.recorded_at).getFullYear();
      const bucket = byYear.get(year) ?? { carbon: 0, bioSum: 0, bioCount: 0, vegSum: 0, vegCount: 0, treeSum: 0, treeCount: 0 };
      bucket.carbon += metric.carbon_tco2e;
      bucket.bioSum += metric.biodiversity_score;
      bucket.bioCount += 1;
      bucket.vegSum += metric.vegetation_index;
      bucket.vegCount += 1;
      bucket.treeSum += metric.tree_cover_percentage;
      bucket.treeCount += 1;
      byYear.set(year, bucket);
    }
  }

  return Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, b]) => ({
      year,
      carbon_tco2e: Math.round(b.carbon * 100) / 100,
      biodiversity_score: b.bioCount ? Math.round((b.bioSum / b.bioCount) * 100) / 100 : 0,
      vegetation_index: b.vegCount ? Math.round((b.vegSum / b.vegCount) * 1000) / 1000 : 0,
      tree_cover_percentage: b.treeCount ? Math.round((b.treeSum / b.treeCount) * 100) / 100 : 0,
    }));
}
