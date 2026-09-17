import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout/DashboardLayout';
import { AnalyticsCard } from '../../components/AnalyticsCard/AnalyticsCard';
import { ChartCard } from '../../components/ChartCard/ChartCard';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { mockProjects } from '../../mocks/mockProjects';
import { getAllSiteAnalytics, mockLatestSiteMetrics } from '../../mocks/mockMetrics';
import { useSiteStore } from '../../store/siteStore';
import type { MetricYearPoint } from '../../types/dashboard';

const YEARS = [2022, 2023, 2024, 2025, 2026];

function averageSeries(seriesList: MetricYearPoint[][]): MetricYearPoint[] {
  return YEARS.map((year, i) => {
    const values = seriesList.map((series) => series[i]?.value ?? 0);
    const avg = values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
    return { year, value: Math.round(avg * 100) / 100 };
  });
}

/**
 * /analytics — global analytics overview with Project / Year filters
 * (Region filter folded into Project since region maps 1:1 with each demo
 * project here). Aggregate KPI cards + four trend/comparison charts, all
 * recomputed from the filtered site set.
 */
export function AnalyticsPage() {
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const sites = useSiteStore((state) => state.sites);
  const fetchSites = useSiteStore((state) => state.fetchSites);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const filteredSites = useMemo(() => {
    if (projectFilter === 'all') return sites;
    return sites.filter((s) => s.project_id === projectFilter);
  }, [projectFilter, sites]);

  const allAnalytics = getAllSiteAnalytics();
  const filteredAnalytics = useMemo(
    () => allAnalytics.filter((a) => filteredSites.some((s) => s.id === a.site_id)),
    [allAnalytics, filteredSites],
  );

  const filteredMetrics = useMemo(
    () => mockLatestSiteMetrics.filter((m) => filteredSites.some((s) => s.id === m.site_id)),
    [filteredSites],
  );

  const totalCarbon = filteredMetrics.reduce((sum, m) => sum + m.carbon_tco2e, 0);
  const avgBiodiversity = filteredMetrics.length
    ? Math.round(filteredMetrics.reduce((sum, m) => sum + m.biodiversity_score, 0) / filteredMetrics.length)
    : 0;
  const totalArea = filteredSites.reduce((sum, s) => sum + s.area_hectares, 0);
  const avgVegetation = filteredMetrics.length
    ? Math.round((filteredMetrics.reduce((sum, m) => sum + m.vegetation_index, 0) / filteredMetrics.length) * 100) / 100
    : 0;

  const carbonSeriesRaw = averageSeries(filteredAnalytics.map((a) => a.carbon));
  const biodiversitySeriesRaw = averageSeries(filteredAnalytics.map((a) => a.biodiversity));
  const vegetationSeriesRaw = averageSeries(filteredAnalytics.map((a) => a.vegetation));

  const applyYearFilter = (series: MetricYearPoint[]) =>
    yearFilter === 'all' ? series : series.filter((p) => String(p.year) === yearFilter);

  const carbonSeries = applyYearFilter(carbonSeriesRaw);
  const biodiversitySeries = applyYearFilter(biodiversitySeriesRaw);
  const vegetationSeries = applyYearFilter(vegetationSeriesRaw);

  const projectComparison = mockProjects
    .filter((p) => projectFilter === 'all' || p.id === projectFilter)
    .map((p) => ({ year: p.total_area_hectares, value: p.total_area_hectares }));

  const sitePerformance = filteredMetrics.map((m, i) => ({ year: i + 1, value: m.carbon_tco2e }));

  const hasData = filteredSites.length > 0 && carbonSeries.length > 0;

  return (
    <DashboardLayout pageTitle="Analytics">
      <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex flex-col gap-space-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-1">Analytics Overview</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Global environmental performance across all monitored projects and sites.{' '}
            <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">(Demo data)</span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-outline-variant px-space-md py-space-xs font-body-sm text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
            aria-label="Filter by project"
          >
            <option value="all">All Projects</option>
            {mockProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-lg border border-outline-variant px-space-md py-space-xs font-body-sm text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
            aria-label="Filter by year"
          >
            <option value="all">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {!hasData ? (
          <EmptyState
            icon="query_stats"
            title="Analytics will appear once site data is available."
            description="Try selecting a different project or year filter."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <AnalyticsCard icon="co2" label="Total Carbon Impact" value={`${(totalCarbon / 1000).toFixed(1)}K tCO\u2082e`} trend={{ direction: 'up', value: '+18.2%' }} />
              <AnalyticsCard icon="eco" label="Average Biodiversity" value={`${avgBiodiversity} / 100`} trend={{ direction: 'up', value: '+11.4%' }} />
              <AnalyticsCard icon="satellite_alt" label="Total Area" value={`${totalArea.toLocaleString()} ha`} />
              <AnalyticsCard icon="grass" label="Average Vegetation Index" value={avgVegetation.toFixed(2)} trend={{ direction: 'up', value: '+14.6%' }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <ChartCard title="Carbon Performance" unit="tCO\u2082e" data={carbonSeries.length ? carbonSeries : carbonSeriesRaw} color="#12372a" />
              <ChartCard title="Biodiversity Performance" unit="/ 100" data={biodiversitySeries.length ? biodiversitySeries : biodiversitySeriesRaw} color="#416656" />
              <ChartCard title="Vegetation Trend" unit="NDVI" data={vegetationSeries.length ? vegetationSeries : vegetationSeriesRaw} color="#10b981" valueFormatter={(v) => v.toFixed(2)} />
              <ChartCard
                title="Project Comparison"
                unit="ha"
                data={projectComparison.length ? projectComparison : [{ year: 0, value: 0 }]}
                color="#00a7c3"
              />
            </div>

            <ChartCard
              title="Site Performance"
              unit="tCO\u2082e"
              data={sitePerformance.length ? sitePerformance : [{ year: 0, value: 0 }]}
              color="#6c5c46"
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
