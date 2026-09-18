import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout/DashboardLayout';
import { KpiCard, CompactKpiCard } from '../../components/KpiCard/KpiCard';
import { MapView } from '../../components/MapView/MapView';
import { ProjectTable } from '../../components/ProjectTable/ProjectTable';
import { SiteDetailsPanel } from '../../components/SiteDetailsPanel/SiteDetailsPanel';
import { Modal } from '../../components/Modal/Modal';
import { ProjectForm } from '../../components/ProjectForm/ProjectForm';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import {
  TableSkeleton,
  KpiCardSkeleton,
  MapSkeleton,
} from '../../components/LoadingSkeleton/LoadingSkeleton';
import { useProjectStore } from '../../store/projectStore';
import { useMapStore } from '../../store/mapStore';
import { useSiteStore } from '../../store/siteStore';
import { analyticsService } from '../../services/analyticsService';
import type { DashboardAnalyticsResponse } from '../../types/dashboard';

/**
 * /dashboard — the authenticated environmental intelligence overview.
 * Primary KPI row (animated counters), secondary indicator row, the main
 * geospatial map with site polygons, and a recent projects table. KPIs
 * are backed by `GET /analytics/dashboard` (real SQL aggregation, see
 * backend/app/services/analytics_service.py::get_dashboard_analytics) —
 * carbon/biodiversity/vegetation show "No monitoring data" rather than a
 * fabricated number when no site_metrics rows exist yet.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { projects, isLoading, error, fetchProjects } = useProjectStore();
  const {
    sites,
    fetchSites,
    getSiteById,
    isLoading: isLoadingSites,
    error: sitesError,
  } = useSiteStore();
  const selectedSiteId = useMapStore((state) => state.selectedSiteId);
  const setSelectedSiteId = useMapStore((state) => state.setSelectedSiteId);
  const [createOpen, setCreateOpen] = useState(false);

  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchSites();
  }, [fetchProjects, fetchSites]);

  const loadAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const data = await analyticsService.getDashboardAnalytics();
      setAnalytics(data);
    } catch {
      // Non-fatal for the whole dashboard — projects/sites/map still work
      // even if the analytics aggregation call fails.
      setAnalyticsError('Unable to load environmental analytics.');
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    // State updates happen in `loadAnalytics`'s async continuation after
    // `await`, not synchronously in this effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
  }, [loadAnalytics]);

  const totalArea =
    analytics?.total_area_hectares ?? sites.reduce((sum, s) => sum + s.area_hectares, 0);
  const activeSites =
    analytics?.active_sites ??
    sites.filter((s) => s.status === 'Active' || s.status === 'Verified').length;

  const selectedSite = selectedSiteId ? (getSiteById(selectedSiteId) ?? null) : null;
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout pageTitle="Environmental Overview">
      <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-space-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-1">
              Environmental Overview
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Monitor your projects, sites and environmental impact from one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="group inline-flex items-center justify-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-200 hover:bg-primary shadow-md shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              add
            </span>
            Create Project
          </button>
        </div>

        {/* Primary KPI row — database-driven via GET /analytics/dashboard (falls back to store-derived counts if that call fails). */}
        {isLoadingAnalytics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <KpiCard
              icon="forest"
              label="Total Projects"
              target={analytics?.total_projects ?? projects.length}
              description="Environmental projects in your portfolio."
            />
            <KpiCard
              icon="pin_drop"
              label="Total Sites"
              target={analytics?.total_sites ?? sites.length}
              description="Geographical sites being monitored."
            />
            <KpiCard
              icon="satellite_alt"
              label="Total Area"
              target={totalArea}
              suffix=" ha"
              formatValue={(v) => v.toLocaleString()}
              description="Total mapped site area."
            />
            <KpiCard
              icon="co2"
              label="Carbon Impact"
              target={analytics?.carbon_total ?? undefined}
              staticValue={analytics?.carbon_total == null ? 'No data available' : undefined}
              suffix={analytics?.carbon_total != null ? ' tCO\u2082e' : undefined}
              formatValue={(v) => v.toLocaleString()}
              tone="accent"
            />
          </div>
        )}

        {/* Secondary indicator row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter-sm">
          <CompactKpiCard
            icon="eco"
            label="Biodiversity Score"
            value={
              analytics?.avg_biodiversity_score != null
                ? `${analytics.avg_biodiversity_score} / 100`
                : 'No data available'
            }
          />
          <CompactKpiCard
            icon="grass"
            label="Vegetation Index"
            value={
              analytics?.avg_vegetation_index != null
                ? analytics.avg_vegetation_index.toFixed(2)
                : 'No data available'
            }
          />
          <CompactKpiCard icon="check_circle" label="Active Sites" value={String(activeSites)} />
          <CompactKpiCard icon="folder" label="Projects" value={String(projects.length)} />
        </div>

        {analyticsError && (
          <p className="font-body-sm text-body-sm text-on-surface-variant -mt-space-sm">
            {analyticsError}{' '}
            <button
              type="button"
              onClick={loadAnalytics}
              className="text-surface-tint hover:text-primary underline"
            >
              Retry
            </button>
          </p>
        )}

        {/* Main geospatial map */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-sm md:p-space-md">
          <div className="flex items-center justify-between mb-space-sm px-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary">
              Project &amp; Site Map
            </h3>
            <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
              {sites.length} {sites.length === 1 ? 'site' : 'sites'}
            </span>
          </div>
          {isLoadingSites ? (
            <div className="h-[380px] md:h-[480px]">
              <MapSkeleton />
            </div>
          ) : sitesError ? (
            <ErrorState
              title="Unable to load sites."
              description={sitesError}
              onRetry={() => {
                useSiteStore.setState({ hasLoaded: false, error: null });
                fetchSites();
              }}
            />
          ) : sites.length === 0 ? (
            <EmptyState
              icon="pin_drop"
              title="No sites have been added yet."
              description="Create a project and add a site to see it on the map."
            />
          ) : (
            <MapView
              sites={sites}
              selectedSiteId={selectedSiteId}
              onSiteSelect={setSelectedSiteId}
              className="h-[380px] md:h-[480px]"
              initialZoom={2.2}
            />
          )}
        </div>

        {/* Recent projects */}
        <div>
          <div className="flex items-center justify-between mb-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary">Recent Projects</h3>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="font-label-technical text-label-micro text-surface-tint hover:text-primary"
            >
              VIEW ALL &rarr;
            </button>
          </div>

          {isLoading && <TableSkeleton />}
          {!isLoading && error && (
            <ErrorState
              title="Unable to load project data."
              description={error}
              onRetry={fetchProjects}
            />
          )}
          {!isLoading && !error && recentProjects.length === 0 && (
            <EmptyState
              icon="forest"
              title="No projects yet."
              description="Create your first environmental project to get started."
              actionLabel="Create Your First Project"
              onAction={() => setCreateOpen(true)}
            />
          )}
          {!isLoading && !error && recentProjects.length > 0 && (
            <ProjectTable projects={recentProjects} />
          )}
        </div>
      </div>

      <SiteDetailsPanel site={selectedSite} onClose={() => setSelectedSiteId(null)} />

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Project">
        <ProjectForm onCancel={() => setCreateOpen(false)} onSuccess={() => setCreateOpen(false)} />
      </Modal>
    </DashboardLayout>
  );
}
