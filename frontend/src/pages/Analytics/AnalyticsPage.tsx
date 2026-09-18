import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout/DashboardLayout';
import { AnalyticsCard } from '../../components/AnalyticsCard/AnalyticsCard';
import { CarbonChart } from '../../components/charts/CarbonChart';
import { PerformanceChart } from '../../components/charts/PerformanceChart';
import { ProjectComparisonChart, type ProjectComparisonDatum } from '../../components/charts/ProjectComparisonChart';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { KpiCardSkeleton, ChartSkeleton, TableSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { TimeRangeFilter } from '../../components/TimeRangeFilter/TimeRangeFilter';
import { filterByTimeRange } from '../../utils/timeRange';
import { MapView } from '../../components/MapView/MapView';
import { useProjectStore } from '../../store/projectStore';
import { useSiteStore } from '../../store/siteStore';
import { useMapStore, type AnalyticsMapMode } from '../../store/mapStore';
import { analyticsService } from '../../services/analyticsService';
import { getApiErrorMessage } from '../../services/apiError';
import { aggregateMetricsByYear } from '../../utils/aggregateMetrics';
import type { AnalyticsTimeRange, Project, Site, SiteAnalyticsResponse } from '../../types/dashboard';

type ComparisonMetric = 'carbon' | 'biodiversity';

interface SiteAnalyticsEntry {
  site: Site;
  analytics: SiteAnalyticsResponse;
}

/**
 * /analytics — global Environmental Analytics experience. Filters
 * (project/site/region/project type/time range) narrow the site set;
 * every KPI, chart, and table row is derived from real per-site/per-
 * project analytics fetched from the backend (never fabricated). Backend
 * aggregation is reused wherever an endpoint already provides it
 * (`GET /projects/:id/analytics` for the comparison chart); the
 * portfolio-wide historical trend and KPIs combine multiple already-
 * backend-computed per-site summaries client-side, since no single
 * endpoint aggregates an arbitrary ad-hoc filter combination.
 */
export function AnalyticsPage() {
  const navigate = useNavigate();
  const { projects, fetchProjects } = useProjectStore();
  const { sites, fetchSites } = useSiteStore();
  const selectedSiteId = useMapStore((state) => state.selectedSiteId);
  const setSelectedSiteId = useMapStore((state) => state.setSelectedSiteId);
  const analyticsMapMode = useMapStore((state) => state.analyticsMode);
  const setAnalyticsMapMode = useMapStore((state) => state.setAnalyticsMode);

  const [projectFilter, setProjectFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('5y');
  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric>('carbon');

  const [entries, setEntries] = useState<SiteAnalyticsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comparisonData, setComparisonData] = useState<ProjectComparisonDatum[]>([]);
  const [isLoadingComparison, setIsLoadingComparison] = useState(true);

  useEffect(() => {
    fetchProjects();
    fetchSites();
  }, [fetchProjects, fetchSites]);

  const regions = useMemo(() => Array.from(new Set(projects.map((p) => p.region))).sort(), [projects]);
  const projectTypes = useMemo(() => Array.from(new Set(projects.map((p) => p.project_type))).sort(), [projects]);

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (p) =>
          (projectFilter === 'all' || p.id === projectFilter) &&
          (regionFilter === 'all' || p.region === regionFilter) &&
          (typeFilter === 'all' || p.project_type === typeFilter),
      ),
    [projects, projectFilter, regionFilter, typeFilter],
  );

  const filteredSites = useMemo(() => {
    const projectIds = new Set(filteredProjects.map((p) => p.id));
    return sites.filter((s) => projectIds.has(s.project_id) && (siteFilter === 'all' || s.id === siteFilter));
  }, [sites, filteredProjects, siteFilter]);

  // Stable, primitive keys derived from the filtered id sets — used as
  // effect/callback dependencies instead of the array references
  // themselves (which change identity on every render).
  const filteredSiteIdsKey = useMemo(() => filteredSites.map((s) => s.id).join(','), [filteredSites]);
  const filteredProjectIdsKey = useMemo(() => filteredProjects.map((p) => p.id).join(','), [filteredProjects]);

  // Load per-site analytics for every filtered site. Small dataset
  // (portfolio-scale, not satellite-scale), so per-site fetches in
  // parallel are the pragmatic choice given the backend doesn't expose a
  // single bulk "analytics for an arbitrary filter combination" endpoint.
  const loadEntries = useCallback(async () => {
    if (filteredSites.length === 0) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        filteredSites.map(async (site) => ({ site, analytics: await analyticsService.getSiteAnalytics(site.id) })),
      );
      setEntries(results);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load environmental analytics.'));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSiteIdsKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries();
  }, [loadEntries]);

  const loadComparison = useCallback(async () => {
    if (filteredProjects.length === 0) {
      setComparisonData([]);
      setIsLoadingComparison(false);
      return;
    }
    setIsLoadingComparison(true);
    try {
      const results = await Promise.all(
        filteredProjects.map(async (project) => {
          const data = await analyticsService.getProjectAnalytics(project.id);
          const value =
            comparisonMetric === 'carbon' ? data.summary.carbon_total : data.summary.avg_biodiversity_score;
          return { projectName: project.name, value: value ?? 0 };
        }),
      );
      setComparisonData(results);
    } catch {
      setComparisonData([]);
    } finally {
      setIsLoadingComparison(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjectIdsKey, comparisonMetric]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComparison();
  }, [loadComparison]);

  const allHistoricalFiltered = useMemo(
    () =>
      entries.map((e) => filterByTimeRange(e.analytics.historical, timeRange, (m) => m.recorded_at)),
    [entries, timeRange],
  );

  const yearlyAggregates = useMemo(() => aggregateMetricsByYear(allHistoricalFiltered), [allHistoricalFiltered]);
  const carbonChartData = useMemo(
    () => yearlyAggregates.map((p) => ({ label: String(p.year), value: p.carbon_tco2e })),
    [yearlyAggregates],
  );

  const totalArea = filteredSites.reduce((sum, s) => sum + s.area_hectares, 0);
  const entriesWithData = entries.filter((e) => e.analytics.summary.carbon_total !== null);
  const totalCarbon = entriesWithData.length
    ? entriesWithData.reduce((sum, e) => sum + (e.analytics.summary.carbon_total ?? 0), 0)
    : null;
  const avgBiodiversity = entriesWithData.length
    ? Math.round(
        (entriesWithData.reduce((sum, e) => sum + (e.analytics.summary.biodiversity_current ?? 0), 0) /
          entriesWithData.length) *
          10,
      ) / 10
    : null;
  const avgVegetation = entriesWithData.length
    ? Math.round(
        (entriesWithData.reduce((sum, e) => sum + (e.analytics.summary.vegetation_current ?? 0), 0) /
          entriesWithData.length) *
          100,
      ) / 100
    : null;

  const metricValuesForMap = useMemo(() => {
    const values: Record<string, number> = {};
    for (const entry of entries) {
      const summary = entry.analytics.summary;
      const value =
        analyticsMapMode === 'carbon'
          ? summary.carbon_total
          : analyticsMapMode === 'biodiversity'
            ? summary.biodiversity_current
            : analyticsMapMode === 'vegetation'
              ? summary.vegetation_current
              : analyticsMapMode === 'treeCover'
                ? summary.tree_cover_current
                : null;
      if (value !== null && value !== undefined) values[entry.site.id] = value;
    }
    return values;
  }, [entries, analyticsMapMode]);

  const hasData = entries.length > 0 && entriesWithData.length > 0;

  return (
    <DashboardLayout pageTitle="Analytics">
      <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex flex-col gap-space-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-1">Environmental Analytics</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Understand environmental performance across your projects and sites.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md flex flex-wrap items-center gap-space-md">
          <FilterSelect
            label="Project"
            value={projectFilter}
            onChange={(v) => {
              setProjectFilter(v);
              setSiteFilter('all');
            }}
            options={[{ value: 'all', label: 'All Projects' }, ...projects.map((p: Project) => ({ value: p.id, label: p.name }))]}
          />
          <FilterSelect
            label="Site"
            value={siteFilter}
            onChange={setSiteFilter}
            options={[{ value: 'all', label: 'All Sites' }, ...filteredSites.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <FilterSelect
            label="Region"
            value={regionFilter}
            onChange={setRegionFilter}
            options={[{ value: 'all', label: 'All Regions' }, ...regions.map((r) => ({ value: r, label: r }))]}
          />
          <FilterSelect
            label="Project Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ value: 'all', label: 'All Types' }, ...projectTypes.map((t) => ({ value: t, label: t }))]}
          />
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>

        {/* Global KPIs */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-gutter">
            {Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-gutter">
            <AnalyticsCard icon="forest" label="Total Projects" value={String(filteredProjects.length)} />
            <AnalyticsCard icon="pin_drop" label="Total Sites" value={String(filteredSites.length)} />
            <AnalyticsCard icon="satellite_alt" label="Total Area" value={`${totalArea.toLocaleString()} ha`} />
            <AnalyticsCard
              icon="co2"
              label="Carbon Impact"
              value={totalCarbon != null ? `${(totalCarbon / 1000).toFixed(1)}K tCO\u2082e` : 'No data available'}
            />
            <AnalyticsCard
              icon="eco"
              label="Average Biodiversity"
              value={avgBiodiversity != null ? `${avgBiodiversity} / 100` : 'No data available'}
            />
            <AnalyticsCard
              icon="grass"
              label="Average Vegetation"
              value={avgVegetation != null ? avgVegetation.toFixed(2) : 'No data available'}
            />
          </div>
        )}

        {!isLoading && error && (
          <ErrorState title="Unable to load environmental analytics." description={error} onRetry={loadEntries} />
        )}

        {!isLoading && !error && filteredSites.length === 0 && (
          <EmptyState
            icon="query_stats"
            title="No sites match these filters."
            description="Try a different project, region, or type filter."
          />
        )}

        {!isLoading && !error && filteredSites.length > 0 && !hasData && (
          <EmptyState
            icon="query_stats"
            title="Environmental analytics are not available yet."
            description="None of the matching sites have monitoring records yet."
          />
        )}

        {!isLoading && !error && hasData && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
              <CarbonChart data={carbonChartData} />

              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-space-sm flex-wrap gap-space-sm">
                  <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
                    Project Comparison
                  </span>
                  <select
                    value={comparisonMetric}
                    onChange={(e) => setComparisonMetric(e.target.value as ComparisonMetric)}
                    className="rounded-lg border border-outline-variant px-space-sm py-1 font-body-sm text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
                  >
                    <option value="carbon">Carbon</option>
                    <option value="biodiversity">Biodiversity</option>
                  </select>
                </div>
                {isLoadingComparison ? (
                  <ChartSkeleton />
                ) : comparisonData.length > 0 ? (
                  <ProjectComparisonChart
                    data={comparisonData}
                    metricLabel={comparisonMetric === 'carbon' ? 'Carbon (tCO\u2082e)' : 'Biodiversity Score'}
                    unit={comparisonMetric === 'carbon' ? 'tCO\u2082e' : '/ 100'}
                  />
                ) : (
                  <EmptyState icon="bar_chart" title="No comparison data available." />
                )}
              </div>
            </div>

            {/* Combined multi-metric portfolio performance overview */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm">
              <span className="font-label-technical text-label-technical text-on-surface-variant uppercase block mb-space-sm">
                Portfolio Performance Overview
              </span>
              <PerformanceChart data={yearlyAggregates} />
            </div>

            {/* Map connection: analytics mode selector + map highlighting the selected site */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-sm md:p-space-md">
              <div className="flex items-center justify-between mb-space-sm px-space-sm flex-wrap gap-space-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary">Analytics Map</h3>
                <div className="flex items-center gap-space-sm">
                  <label htmlFor="analytics-map-mode" className="font-body-sm text-body-sm text-on-surface-variant">
                    Visualize
                  </label>
                  <select
                    id="analytics-map-mode"
                    value={analyticsMapMode}
                    onChange={(e) => setAnalyticsMapMode(e.target.value as AnalyticsMapMode)}
                    className="rounded-lg border border-outline-variant px-space-sm py-1 font-body-sm text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
                  >
                    <option value="none">None</option>
                    <option value="carbon">Carbon</option>
                    <option value="biodiversity">Biodiversity</option>
                    <option value="vegetation">Vegetation</option>
                    <option value="treeCover">Tree Cover</option>
                  </select>
                </div>
              </div>
              <MapView
                sites={filteredSites}
                selectedSiteId={selectedSiteId}
                onSiteSelect={setSelectedSiteId}
                className="h-[380px] md:h-[460px]"
                initialZoom={2.2}
                analyticsMode={analyticsMapMode}
                metricValues={metricValuesForMap}
              />
            </div>

            {/* Site performance table */}
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-space-sm">Site Performance</h3>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low font-label-technical text-label-micro text-on-surface-variant uppercase">
                          <th scope="col" className="py-space-sm px-space-lg">Site</th>
                          <th scope="col" className="py-space-sm px-space-md">Project</th>
                          <th scope="col" className="py-space-sm px-space-md">Area</th>
                          <th scope="col" className="py-space-sm px-space-md">Carbon</th>
                          <th scope="col" className="py-space-sm px-space-md">Biodiversity</th>
                          <th scope="col" className="py-space-sm px-space-md">Vegetation</th>
                          <th scope="col" className="py-space-sm px-space-md">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
                        {entries.map(({ site, analytics }) => {
                          const project = projects.find((p) => p.id === site.project_id);
                          return (
                            <tr
                              key={site.id}
                              onClick={() => navigate(`/sites/${site.id}`)}
                              className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                            >
                              <td className="py-space-sm px-space-lg font-headline-sm text-headline-sm text-primary">{site.name}</td>
                              <td className="py-space-sm px-space-md text-on-surface">{project?.name ?? '—'}</td>
                              <td className="py-space-sm px-space-md text-primary font-medium">{site.area_hectares.toLocaleString()} ha</td>
                              <td className="py-space-sm px-space-md text-on-surface">
                                {analytics.summary.carbon_total != null ? `${analytics.summary.carbon_total.toLocaleString()} tCO\u2082e` : '—'}
                              </td>
                              <td className="py-space-sm px-space-md text-on-surface">
                                {analytics.summary.biodiversity_current != null ? `${analytics.summary.biodiversity_current} / 100` : '—'}
                              </td>
                              <td className="py-space-sm px-space-md text-on-surface">
                                {analytics.summary.vegetation_current != null ? analytics.summary.vegetation_current.toFixed(2) : '—'}
                              </td>
                              <td className="py-space-sm px-space-md">
                                <StatusBadge status={site.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-space-sm">
      <label className="font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-outline-variant px-space-md py-space-xs font-body-sm text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
