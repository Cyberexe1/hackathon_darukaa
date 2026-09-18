import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout/DashboardLayout';
import { MapView } from '../../components/MapView/MapView';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Modal } from '../../components/Modal/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { MetricForm } from '../../components/MetricForm/MetricForm';
import { AddSiteFlow } from '../../components/AddSiteFlow/AddSiteFlow';
import { KpiCard } from '../../components/KpiCard/KpiCard';
import { PerformanceSummaryCard } from '../../components/PerformanceSummaryCard/PerformanceSummaryCard';
import { CarbonChart } from '../../components/charts/CarbonChart';
import { BiodiversityChart } from '../../components/charts/BiodiversityChart';
import { VegetationChart } from '../../components/charts/VegetationChart';
import { TreeCoverChart } from '../../components/charts/TreeCoverChart';
import { TimeRangeFilter } from '../../components/TimeRangeFilter/TimeRangeFilter';
import { filterByTimeRange } from '../../utils/timeRange';
import { ChartSkeleton, KpiCardSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';
import { useProjectStore } from '../../store/projectStore';
import { useSiteStore } from '../../store/siteStore';
import { analyticsService } from '../../services/analyticsService';
import { getApiErrorMessage } from '../../services/apiError';
import type {
  AnalyticsTimeRange,
  Site,
  SiteAnalyticsResponse,
  SiteMetric,
  SiteMetricInput,
} from '../../types/dashboard';

/**
 * /sites/:siteId — Site Details + Environmental Analytics page. Shows the
 * site's exact PostGIS-backed polygon plus real, backend-computed
 * historical environmental performance (carbon, biodiversity, vegetation,
 * tree cover) sourced from `GET /sites/:id/analytics`. Any authenticated
 * owner of the site can add/edit/delete measurements — there's no
 * separate "administrator" role enforced anywhere else in this app's UI,
 * so this follows the same ownership-based access model as project/site
 * management rather than introducing a new one.
 */
export function SiteAnalyticsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { getSiteById, fetchSiteById, deleteSite } = useSiteStore();
  const { getProjectById, fetchProjectById } = useProjectStore();

  const cachedSite = siteId ? getSiteById(siteId) : undefined;
  const [fetchedSite, setFetchedSite] = useState<Site | undefined>(undefined);
  const [isFetchingSite, setIsFetchingSite] = useState(true);
  const [siteError, setSiteError] = useState<string | null>(null);

  const site = cachedSite ?? fetchedSite;
  const isLoadingSite = !site && isFetchingSite;
  const project = site ? getProjectById(site.project_id) : undefined;

  const [analytics, setAnalytics] = useState<SiteAnalyticsResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('5y');

  const [addOpen, setAddOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<SiteMetric | null>(null);
  const [deletingMetric, setDeletingMetric] = useState<SiteMetric | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editSiteOpen, setEditSiteOpen] = useState(false);
  const [deleteSiteOpen, setDeleteSiteOpen] = useState(false);
  const [isDeletingSite, setIsDeletingSite] = useState(false);
  const [deleteSiteError, setDeleteSiteError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId || cachedSite) return;
    let cancelled = false;
    fetchSiteById(siteId)
      .then((s) => {
        if (!cancelled) setFetchedSite(s);
      })
      .catch((err) => {
        if (!cancelled)
          setSiteError(
            getApiErrorMessage(err, 'This site may have been removed or the link is incorrect.'),
          );
      })
      .finally(() => {
        if (!cancelled) setIsFetchingSite(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, cachedSite]);

  useEffect(() => {
    if (site && !getProjectById(site.project_id)) {
      fetchProjectById(site.project_id).catch(() => {
        // Non-fatal — the project name simply falls back to "—" below.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  const loadAnalytics = useCallback(async () => {
    if (!siteId) return;
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const data = await analyticsService.getSiteAnalytics(siteId);
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(getApiErrorMessage(err, 'Unable to load environmental analytics.'));
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [siteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
  }, [loadAnalytics]);

  const filteredHistorical = useMemo(() => {
    if (!analytics) return [];
    return filterByTimeRange(analytics.historical, timeRange, (m) => m.recorded_at);
  }, [analytics, timeRange]);

  const chartData = useMemo(
    () => ({
      carbon: filteredHistorical.map((m) => ({ label: m.recorded_at, value: m.carbon_tco2e })),
      biodiversity: filteredHistorical.map((m) => ({
        label: m.recorded_at,
        value: m.biodiversity_score,
      })),
      vegetation: filteredHistorical.map((m) => ({
        label: m.recorded_at,
        value: m.vegetation_index,
      })),
      treeCover: filteredHistorical.map((m) => ({
        label: m.recorded_at,
        value: m.tree_cover_percentage,
      })),
    }),
    [filteredHistorical],
  );

  const handleCreateMetric = async (input: SiteMetricInput) => {
    if (!siteId) return;
    await analyticsService.createMetric(siteId, input);
    setAddOpen(false);
    await loadAnalytics();
  };

  const handleUpdateMetric = async (input: SiteMetricInput) => {
    if (!siteId || !editingMetric) return;
    await analyticsService.updateMetric(siteId, editingMetric.id, input);
    setEditingMetric(null);
    await loadAnalytics();
  };

  const handleDeleteMetric = async () => {
    if (!siteId || !deletingMetric) return;
    setIsDeleting(true);
    try {
      await analyticsService.deleteMetric(siteId, deletingMetric.id);
      setDeletingMetric(null);
      await loadAnalytics();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!site) return;
    setIsDeletingSite(true);
    setDeleteSiteError(null);
    try {
      await deleteSite(site.id);
      navigate(project ? `/projects/${project.id}` : '/sites');
    } catch (err) {
      setDeleteSiteError(getApiErrorMessage(err, 'Unable to delete this site. Please try again.'));
    } finally {
      setIsDeletingSite(false);
    }
  };

  if (isLoadingSite) {
    return (
      <DashboardLayout pageTitle="Loading…">
        <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex items-center justify-center">
          <span
            className="w-10 h-10 rounded-full border-3 border-surface-tint/30 border-t-surface-tint animate-spin"
            aria-hidden="true"
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!site) {
    return (
      <DashboardLayout pageTitle="Site not found">
        <div className="p-4 md:p-space-lg max-w-[900px] mx-auto">
          <ErrorState
            title="Unable to load site data."
            description={siteError ?? 'This site may have been removed or the link is incorrect.'}
            onRetry={() => navigate('/sites')}
          />
        </div>
      </DashboardLayout>
    );
  }

  const hasMetrics = Boolean(analytics && analytics.historical.length > 0);

  return (
    <DashboardLayout pageTitle={site.name}>
      <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex flex-col gap-space-lg">
        <nav
          aria-label="Breadcrumb"
          className="font-label-technical text-label-micro text-on-surface-variant"
        >
          <Link to="/dashboard" className="hover:text-primary">
            Dashboard
          </Link>
          <span className="mx-1">/</span>
          {project ? (
            <Link to={`/projects/${project.id}`} className="hover:text-primary">
              {project.name}
            </Link>
          ) : (
            <Link to="/sites" className="hover:text-primary">
              Sites
            </Link>
          )}
          <span className="mx-1">/</span>
          <span className="text-primary">{site.name}</span>
        </nav>

        <div className="flex items-start justify-between gap-space-md flex-wrap">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h2 className="font-headline-lg text-headline-lg text-primary">{site.name}</h2>
              <StatusBadge status={site.status} />
            </div>
            {site.description && (
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
                {site.description}
              </p>
            )}
            {project && (
              <p className="font-label-technical text-label-micro text-on-surface-variant mt-space-xs">
                Project:{' '}
                <Link
                  to={`/projects/${project.id}`}
                  className="text-surface-tint hover:text-primary"
                >
                  {project.name}
                </Link>
              </p>
            )}
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={() => navigate(project ? `/projects/${project.id}` : '/sites')}
              className="inline-flex items-center gap-1.5 px-space-md py-space-sm rounded-lg font-headline-sm text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_back
              </span>
              Back to Project
            </button>
            <button
              type="button"
              onClick={() => setEditSiteOpen(true)}
              className="inline-flex items-center gap-1.5 px-space-md py-space-sm rounded-lg font-headline-sm text-body-sm text-primary bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                edit
              </span>
              Edit Site
            </button>
            <button
              type="button"
              onClick={() => setDeleteSiteOpen(true)}
              className="inline-flex items-center gap-1.5 px-space-md py-space-sm rounded-lg font-headline-sm text-body-sm text-error hover:bg-error-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                delete
              </span>
              Delete Site
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {isLoadingAnalytics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-gutter">
            {Array.from({ length: 5 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-gutter">
            <KpiCard
              icon="satellite_alt"
              label="Area"
              target={site.area_hectares}
              suffix=" ha"
              formatValue={(v) => v.toLocaleString()}
            />
            <KpiCard
              icon="co2"
              label="Carbon Impact"
              target={analytics?.summary.carbon_total ?? undefined}
              staticValue={
                analytics?.summary.carbon_total == null ? 'No data available' : undefined
              }
              suffix={analytics?.summary.carbon_total != null ? ' tCO\u2082e' : undefined}
              formatValue={(v) => v.toLocaleString()}
              tone="accent"
            />
            <KpiCard
              icon="eco"
              label="Biodiversity"
              target={analytics?.summary.biodiversity_current ?? undefined}
              staticValue={
                analytics?.summary.biodiversity_current == null ? 'No data available' : undefined
              }
              suffix={analytics?.summary.biodiversity_current != null ? ' / 100' : undefined}
            />
            <KpiCard
              icon="grass"
              label="Vegetation Index"
              staticValue={
                analytics?.summary.vegetation_current != null
                  ? analytics.summary.vegetation_current.toFixed(2)
                  : 'No data available'
              }
            />
            <KpiCard
              icon="forest"
              label="Tree Cover"
              target={analytics?.summary.tree_cover_current ?? undefined}
              staticValue={
                analytics?.summary.tree_cover_current == null ? 'No data available' : undefined
              }
              suffix={analytics?.summary.tree_cover_current != null ? '%' : undefined}
            />
          </div>
        )}

        {/* Site boundary map + location figures */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-sm md:p-space-md">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-space-sm px-space-sm">
            Location
          </h3>
          <MapView
            sites={[site]}
            selectedSiteId={site.id}
            className="h-[320px] md:h-[400px]"
            initialCenter={[site.centroid.lon, site.centroid.lat]}
            fitBoundsToSites
            showLayerControl={false}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mt-space-sm px-space-sm">
            <div className="p-space-sm bg-surface-container-low rounded-lg">
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                Area
              </span>
              <span className="font-headline-sm text-headline-sm text-primary">
                {site.area_hectares.toLocaleString()} ha
              </span>
            </div>
            <div className="p-space-sm bg-surface-container-low rounded-lg">
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                Perimeter
              </span>
              <span className="font-headline-sm text-headline-sm text-primary">
                {site.perimeter_km.toLocaleString()} km
              </span>
            </div>
            <div className="p-space-sm bg-surface-container-low rounded-lg">
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                Centroid
              </span>
              <span className="font-headline-sm text-headline-sm text-primary">
                {site.centroid.lon.toFixed(2)}&deg;, {site.centroid.lat.toFixed(2)}&deg;
              </span>
            </div>
            <div className="p-space-sm bg-surface-container-low rounded-lg">
              <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                Created
              </span>
              <span className="font-headline-sm text-headline-sm text-primary">
                {new Date(site.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Environmental analytics */}
        <div className="flex items-center justify-between flex-wrap gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-primary">
            Historical Environmental Performance
          </h3>
          <div className="flex items-center gap-space-md flex-wrap">
            {hasMetrics && <TimeRangeFilter value={timeRange} onChange={setTimeRange} />}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-space-sm bg-primary-container text-on-primary px-space-md py-space-xs rounded-lg font-headline-sm text-body-sm transition-all duration-200 hover:bg-primary"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                add
              </span>
              Add Measurement
            </button>
          </div>
        </div>

        {isLoadingAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        )}

        {!isLoadingAnalytics && analyticsError && (
          <ErrorState
            title="Unable to load environmental analytics."
            description={analyticsError}
            onRetry={loadAnalytics}
          />
        )}

        {!isLoadingAnalytics && !analyticsError && !hasMetrics && (
          <EmptyState
            icon="monitoring"
            title="Environmental analytics are not available yet."
            description="No monitoring records have been added for this site."
            actionLabel="Add Measurement"
            onAction={() => setAddOpen(true)}
          />
        )}

        {!isLoadingAnalytics && !analyticsError && hasMetrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <CarbonChart data={chartData.carbon} />
              <BiodiversityChart data={chartData.biodiversity} />
              <VegetationChart data={chartData.vegetation} />
              <TreeCoverChart data={chartData.treeCover} />
            </div>

            {analytics && (
              <PerformanceSummaryCard
                performance={analytics.performance}
                summary={analytics.summary}
              />
            )}

            {/* Measurement records — edit/delete */}
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-space-sm">
                Measurement Records
              </h3>
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low font-label-technical text-label-micro text-on-surface-variant uppercase">
                        <th scope="col" className="py-space-sm px-space-lg">
                          Date
                        </th>
                        <th scope="col" className="py-space-sm px-space-md">
                          Carbon
                        </th>
                        <th scope="col" className="py-space-sm px-space-md">
                          Biodiversity
                        </th>
                        <th scope="col" className="py-space-sm px-space-md">
                          Vegetation
                        </th>
                        <th scope="col" className="py-space-sm px-space-md">
                          Tree Cover
                        </th>
                        <th scope="col" className="py-space-sm px-space-lg text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
                      {analytics?.historical.map((metric) => (
                        <tr
                          key={metric.id}
                          className="hover:bg-surface-container-low/50 transition-colors"
                        >
                          <td className="py-space-sm px-space-lg text-on-surface">
                            {metric.recorded_at}
                          </td>
                          <td className="py-space-sm px-space-md text-primary font-medium">
                            {metric.carbon_tco2e.toLocaleString()} tCO{'\u2082'}e
                          </td>
                          <td className="py-space-sm px-space-md text-on-surface">
                            {metric.biodiversity_score} / 100
                          </td>
                          <td className="py-space-sm px-space-md text-on-surface">
                            {metric.vegetation_index.toFixed(2)}
                          </td>
                          <td className="py-space-sm px-space-md text-on-surface">
                            {metric.tree_cover_percentage}%
                          </td>
                          <td className="py-space-sm px-space-lg text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingMetric(metric)}
                              className="text-surface-tint hover:text-primary font-label-technical text-label-micro mr-space-md"
                            >
                              EDIT
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingMetric(metric)}
                              className="text-error hover:opacity-80 font-label-technical text-label-micro"
                            >
                              DELETE
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Measurement">
        <MetricForm onSubmit={handleCreateMetric} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal
        isOpen={Boolean(editingMetric)}
        onClose={() => setEditingMetric(null)}
        title="Edit Measurement"
      >
        {editingMetric && (
          <MetricForm
            initial={editingMetric}
            onSubmit={handleUpdateMetric}
            onCancel={() => setEditingMetric(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingMetric)}
        title="Delete this environmental measurement?"
        description="This action cannot be undone."
        isConfirming={isDeleting}
        onConfirm={handleDeleteMetric}
        onCancel={() => setDeletingMetric(null)}
      />

      <AddSiteFlow
        isOpen={editSiteOpen}
        onClose={() => setEditSiteOpen(false)}
        site={site}
        onUpdated={(updated) => setFetchedSite(updated)}
      />

      <ConfirmDialog
        isOpen={deleteSiteOpen}
        title={`Delete "${site.name}"?`}
        description={
          deleteSiteError ??
          'This permanently removes the site, its boundary, and all of its environmental measurements. This action cannot be undone.'
        }
        isConfirming={isDeletingSite}
        onConfirm={handleDeleteSite}
        onCancel={() => {
          setDeleteSiteOpen(false);
          setDeleteSiteError(null);
        }}
      />
    </DashboardLayout>
  );
}
