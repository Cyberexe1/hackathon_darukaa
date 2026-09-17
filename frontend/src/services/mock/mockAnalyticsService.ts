import type { PerformanceSummary, SiteAnalytics } from '../../types/dashboard';
import { getAllSiteAnalytics, getSiteAnalytics } from '../../mocks/mockMetrics';
import { getMockDashboardOverview } from '../../mocks/mockDashboardOverview';

const LATENCY_MS = 400;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function pctChange(series: { value: number }[]): number {
  if (series.length < 2) return 0;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  if (first === 0) return 0;
  return Math.round(((last - first) / first) * 1000) / 10;
}

/**
 * Mock analytics service. Computes derived performance summaries from the
 * same synthetic time-series used by the chart components, keeping the
 * "demo data" single-sourced in `src/mocks`.
 */
export const mockAnalyticsService = {
  async getSiteAnalytics(siteId: string): Promise<SiteAnalytics | undefined> {
    return delay(getSiteAnalytics(siteId));
  },

  async getAllSiteAnalytics(): Promise<SiteAnalytics[]> {
    return delay(getAllSiteAnalytics());
  },

  async getSitePerformanceSummary(siteId: string, areaHectares: number): Promise<PerformanceSummary | undefined> {
    const analytics = getSiteAnalytics(siteId);
    if (!analytics) return delay(undefined);

    return delay({
      carbon_change_pct: pctChange(analytics.carbon),
      biodiversity_change_pct: pctChange(analytics.biodiversity),
      vegetation_change_pct: pctChange(analytics.vegetation),
      area_hectares: areaHectares,
    });
  },

  async getDashboardOverview() {
    return delay(getMockDashboardOverview());
  },
};
