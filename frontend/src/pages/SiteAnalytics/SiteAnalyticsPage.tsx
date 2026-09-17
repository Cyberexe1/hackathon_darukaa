import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout/DashboardLayout';
import { MapView } from '../../components/MapView/MapView';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useProjectStore } from '../../store/projectStore';
import { useSiteStore } from '../../store/siteStore';
import { getApiErrorMessage } from '../../services/apiError';
import type { Site } from '../../types/dashboard';

/**
 * /sites/:siteId — Site Details page. Shows the site's exact PostGIS-backed
 * polygon on a map plus its authoritative area/perimeter/centroid/status.
 * Environmental metrics (carbon, biodiversity, vegetation) aren't
 * implemented yet — rather than fabricate demo numbers, this renders a
 * clean empty state until real monitoring data exists.
 */
export function SiteAnalyticsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { getSiteById, fetchSiteById } = useSiteStore();
  const { getProjectById, fetchProjectById } = useProjectStore();

  const cachedSite = siteId ? getSiteById(siteId) : undefined;
  // Only used for the async-fetch-fallback path (site not yet cached in
  // the store, e.g. a direct URL visit/refresh).
  const [fetchedSite, setFetchedSite] = useState<Site | undefined>(undefined);
  const [isFetchingSite, setIsFetchingSite] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const site = cachedSite ?? fetchedSite;
  const isLoading = !site && isFetchingSite;
  const project = site ? getProjectById(site.project_id) : undefined;

  useEffect(() => {
    if (!siteId || cachedSite) return;
    let cancelled = false;
    fetchSiteById(siteId)
      .then((s) => {
        if (!cancelled) setFetchedSite(s);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'This site may have been removed or the link is incorrect.'));
      })
      .finally(() => {
        if (!cancelled) setIsFetchingSite(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, cachedSite]);

  // Once the site resolves, ensure its parent project is available for
  // the breadcrumb/KPI card (cheap no-op if already cached).
  useEffect(() => {
    if (site && !getProjectById(site.project_id)) {
      fetchProjectById(site.project_id).catch(() => {
        // Non-fatal — the project name simply falls back to "—" below.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  if (isLoading) {
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
            description={error ?? 'This site may have been removed or the link is incorrect.'}
            onRetry={() => navigate('/sites')}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={site.name}>
      <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex flex-col gap-space-lg">
        <nav aria-label="Breadcrumb" className="font-label-technical text-label-micro text-on-surface-variant">
          <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
          <span className="mx-1">/</span>
          <Link to="/projects" className="hover:text-primary">Projects</Link>
          <span className="mx-1">/</span>
          {project && (
            <>
              <Link to={`/projects/${project.id}`} className="hover:text-primary">{project.name}</Link>
              <span className="mx-1">/</span>
            </>
          )}
          <span className="text-primary">{site.name}</span>
        </nav>

        <div className="flex items-center gap-space-sm flex-wrap">
          <h2 className="font-headline-lg text-headline-lg text-primary">{site.name}</h2>
          <StatusBadge status={site.status} />
        </div>
        {site.description && (
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl -mt-space-sm">{site.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm">
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm">
            <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">Area</span>
            <span className="font-headline-sm text-headline-sm text-primary">{site.area_hectares.toLocaleString()} ha</span>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm">
            <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">Perimeter</span>
            <span className="font-headline-sm text-headline-sm text-primary">{site.perimeter_km.toLocaleString()} km</span>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm">
            <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">Centroid</span>
            <span className="font-headline-sm text-headline-sm text-primary">
              {site.centroid.lat.toFixed(4)}, {site.centroid.lon.toFixed(4)}
            </span>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm">
            <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">Status</span>
            <StatusBadge status={site.status} className="mt-1" />
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm">
            <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">Project</span>
            <span className="font-headline-sm text-headline-sm text-primary truncate block">{project?.name ?? '—'}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-sm md:p-space-md">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-space-sm px-space-sm">Site Boundary</h3>
          <MapView
            sites={[site]}
            selectedSiteId={site.id}
            className="h-[320px] md:h-[400px]"
            initialCenter={[site.centroid.lon, site.centroid.lat]}
            initialZoom={13}
            showLayerControl={false}
          />
        </div>

        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary mb-space-sm">Environmental Metrics</h3>
          <EmptyState
            icon="monitoring"
            title="No monitoring data yet."
            description="Environmental analytics will appear here once monitoring data is available."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
