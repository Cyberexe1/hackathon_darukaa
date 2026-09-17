import type { MetricYearPoint, SiteAnalytics, SiteMetric } from '../types/dashboard';
import { mockSites } from './mockSites';

const YEARS = [2022, 2023, 2024, 2025, 2026];

/**
 * Deterministic per-site growth curves so every site has plausible but
 * distinct demo analytics, without needing a persisted metrics table yet.
 */
function buildSeries(base: number, growthPerYear: number, jitterSeed: number): MetricYearPoint[] {
  return YEARS.map((year, index) => {
    const jitter = Math.sin(jitterSeed + index) * (growthPerYear * 0.08);
    const value = base + growthPerYear * index + jitter;
    return { year, value: Math.round(value * 100) / 100 };
  });
}

const siteAnalyticsMap: Record<string, SiteAnalytics> = {};

mockSites.forEach((site, i) => {
  const carbonBase = 700 + i * 120;
  const carbonGrowth = 480 + i * 40;
  const bioBase = 68 + (i % 3) * 3;
  const bioGrowth = 3.4 + (i % 2) * 0.6;
  const vegBase = 0.56 + (i % 4) * 0.02;
  const vegGrowth = 0.045 + (i % 3) * 0.01;

  siteAnalyticsMap[site.id] = {
    site_id: site.id,
    carbon: buildSeries(carbonBase, carbonGrowth, i),
    biodiversity: buildSeries(bioBase, bioGrowth, i + 1).map((p) => ({
      ...p,
      value: Math.min(100, Math.round(p.value)),
    })),
    vegetation: buildSeries(vegBase, vegGrowth, i + 2).map((p) => ({
      ...p,
      value: Math.round(Math.min(1, p.value) * 100) / 100,
    })),
  };
});

export function getSiteAnalytics(siteId: string): SiteAnalytics | undefined {
  return siteAnalyticsMap[siteId];
}

export function getAllSiteAnalytics(): SiteAnalytics[] {
  return Object.values(siteAnalyticsMap);
}

/** Flattened latest-year SiteMetric records, e.g. for table/detail views. */
export const mockLatestSiteMetrics: SiteMetric[] = mockSites.map((site, i) => {
  const analytics = siteAnalyticsMap[site.id];
  const latest = analytics.carbon[analytics.carbon.length - 1];
  const latestBio = analytics.biodiversity[analytics.biodiversity.length - 1];
  const latestVeg = analytics.vegetation[analytics.vegetation.length - 1];

  return {
    id: `metric-${site.id}`,
    site_id: site.id,
    recorded_at: '2026-08-01T00:00:00Z',
    carbon_tco2e: latest.value,
    biodiversity_score: latestBio.value,
    vegetation_index: latestVeg.value,
    tree_cover_percentage: Math.round(55 + (i % 5) * 6),
  };
});

export function getLatestMetricForSite(siteId: string): SiteMetric | undefined {
  return mockLatestSiteMetrics.find((m) => m.site_id === siteId);
}
