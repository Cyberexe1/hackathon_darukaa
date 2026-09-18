import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout/DashboardLayout';
import { KpiCard } from '../../components/KpiCard/KpiCard';
import {
  KpiCardSkeleton,
  MapSkeleton,
  TableSkeleton,
} from '../../components/LoadingSkeleton/LoadingSkeleton';
import { MapView } from '../../components/MapView/MapView';
import { SiteTable } from '../../components/SiteTable/SiteTable';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { SiteDetailsPanel } from '../../components/SiteDetailsPanel/SiteDetailsPanel';
import { getApiErrorMessage } from '../../services/apiError';
import { analyticsService } from '../../services/analyticsService';
import { useMapStore } from '../../store/mapStore';
import { useProjectStore } from '../../store/projectStore';
import { useSiteStore } from '../../store/siteStore';
import type { Project, ProjectAnalyticsResponse } from '../../types/dashboard';

/** /projects/:projectId — single project detail with KPIs, map, and site list. */
export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const selectedSiteId = useMapStore((state) => state.selectedSiteId);
  const setSelectedSiteId = useMapStore((state) => state.setSelectedSiteId);
  const {
    getSitesByProjectId,
    getSiteById,
    fetchSites,
    isLoading: isLoadingSites,
    error: sitesError,
  } = useSiteStore();
  const { getProjectById, fetchProjectById } = useProjectStore();

  const cachedProject = projectId ? getProjectById(projectId) : undefined;
  // Only used for the async-fetch-fallback path (project not yet cached
  // in the store, e.g. a direct URL visit/refresh). When the project is
  // already in the store, we read it straight from there instead of
  // mirroring it into local state.
  const [fetchedProject, setFetchedProject] = useState<Project | undefined>(undefined);
  const [isFetchingProject, setIsFetchingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  const project = cachedProject ?? fetchedProject;
  // Only actually "loading" while we have no project to show yet — once
  // the store already has it cached, isFetchingProject settling later has
  // no visible effect.
  const isLoadingProject = !project && isFetchingProject;

  const sites = useMemo(
    () => (projectId ? getSitesByProjectId(projectId) : []),
    [projectId, getSitesByProjectId],
  );

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Load the project directly if it isn't already cached in the store —
  // e.g. the user opened this URL directly or refreshed the page without
  // visiting /projects first. All state updates happen inside the
  // promise's continuation, never synchronously in the effect body.
  useEffect(() => {
    if (!projectId || cachedProject) return;
    let cancelled = false;
    fetchProjectById(projectId)
      .then((p) => {
        if (!cancelled) setFetchedProject(p);
      })
      .catch((error) => {
        if (!cancelled) setProjectError(getApiErrorMessage(error, 'Project not found.'));
      })
      .finally(() => {
        if (!cancelled) setIsFetchingProject(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, cachedProject]);

  useEffect(() => {
    return () => setSelectedSiteId(null);
  }, [setSelectedSiteId]);

  const [analytics, setAnalytics] = useState<ProjectAnalyticsResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  const loadAnalytics = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingAnalytics(true);
    try {
      const data = await analyticsService.getProjectAnalytics(projectId);
      setAnalytics(data);
    } catch {
      // Non-fatal — the KPI cards simply fall back to "No data available".
      setAnalytics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoadingProject) {
    return (
      <DashboardLayout pageTitle="Loading…">
        <div className="p-4 md:p-space-lg max-w-[900px] mx-auto flex items-center justify-center">
          <span
            className="w-10 h-10 rounded-full border-3 border-surface-tint/30 border-t-surface-tint animate-spin"
            aria-hidden="true"
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout pageTitle="Project not found">
        <div className="p-4 md:p-space-lg max-w-[900px] mx-auto">
          <ErrorState
            title="Unable to load project data."
            description={
              projectError ?? 'This project may have been removed or the link is incorrect.'
            }
            onRetry={() => navigate('/projects')}
          />
        </div>
      </DashboardLayout>
    );
  }

  const selectedSite = selectedSiteId ? (getSiteById(selectedSiteId) ?? null) : null;

  return (
    <DashboardLayout pageTitle={project.name}>
      <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex flex-col gap-space-lg">
        <nav
          aria-label="Breadcrumb"
          className="font-label-technical text-label-micro text-on-surface-variant"
        >
          <Link to="/dashboard" className="hover:text-primary">
            Dashboard
          </Link>
          <span className="mx-1">/</span>
          <Link to="/projects" className="hover:text-primary">
            Projects
          </Link>
          <span className="mx-1">/</span>
          <span className="text-primary">{project.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-sm mb-1">
              <h2 className="font-headline-lg text-headline-lg text-primary">{project.name}</h2>
              <StatusBadge status={project.status} />
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              {project.description}
            </p>
            <p className="font-label-technical text-label-micro text-on-surface-variant mt-space-xs uppercase">
              {project.project_type} &middot; {project.region}, {project.country}
            </p>
          </div>
        </div>

        {isLoadingAnalytics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <KpiCard icon="pin_drop" label="Sites" target={project.site_count} />
            <KpiCard
              icon="satellite_alt"
              label="Area"
              target={project.total_area_hectares}
              suffix=" ha"
              formatValue={(v) => v.toLocaleString()}
            />
            <KpiCard
              icon="co2"
              label="Carbon"
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
              target={analytics?.summary.avg_biodiversity_score ?? undefined}
              staticValue={
                analytics?.summary.avg_biodiversity_score == null ? 'No data available' : undefined
              }
              suffix={analytics?.summary.avg_biodiversity_score != null ? ' / 100' : undefined}
            />
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-sm md:p-space-md">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-space-sm px-space-sm">
            Project Map
          </h3>
          {isLoadingSites ? (
            <div className="h-[360px] md:h-[440px]">
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
              title="No geographical sites have been added."
              description="Add a site to see it on the map."
            />
          ) : (
            <MapView
              sites={sites}
              selectedSiteId={selectedSiteId}
              onSiteSelect={setSelectedSiteId}
              className="h-[360px] md:h-[440px]"
              initialZoom={9}
            />
          )}
        </div>

        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary mb-space-sm">Sites</h3>
          {isLoadingSites ? (
            <TableSkeleton />
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
              title="No geographical sites have been added."
              description="Add a site to start monitoring boundaries and biometrics for this project."
              actionLabel="Add Site"
              onAction={() => navigate('/sites')}
            />
          ) : (
            <SiteTable sites={sites} showProjectColumn={false} />
          )}
        </div>
      </div>

      <SiteDetailsPanel site={selectedSite} onClose={() => setSelectedSiteId(null)} />
    </DashboardLayout>
  );
}
