import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Site, SiteAnalyticsSummary } from '../../types/dashboard';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import { analyticsService } from '../../services/analyticsService';
import { SitePanelSkeleton } from '../LoadingSkeleton/LoadingSkeleton';

interface SiteDetailsPanelProps {
  site: Site | null;
  isLoading?: boolean;
  onClose: () => void;
}

/**
 * Right-hand slide-over panel showing key figures for the selected site,
 * triggered by clicking a polygon on MapView. Becomes a full-screen
 * overlay on small viewports instead of a narrow sidebar.
 */
export function SiteDetailsPanel({ site, isLoading, onClose }: SiteDetailsPanelProps) {
  const navigate = useNavigate();
  const getProjectById = useProjectStore((state) => state.getProjectById);
  const [metricsSummary, setMetricsSummary] = useState<SiteAnalyticsSummary | null>(null);

  useEffect(() => {
    if (!site && !isLoading) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [site, isLoading, onClose]);

  // Fetch the site's environmental metrics summary (if any exist) whenever
  // the selected site changes, so the panel shows real recorded values
  // instead of always claiming "No monitoring data".
  useEffect(() => {
    if (!site) return;
    // Clear any previous site's figures immediately so we never briefly
    // show stale metrics while the new fetch below is in flight — this
    // is synchronizing local state with an external system (the API),
    // not deriving it from props/state that could be computed during
    // render instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMetricsSummary(null);
    let cancelled = false;
    analyticsService
      .getSiteAnalytics(site.id)
      .then((data) => {
        if (!cancelled) setMetricsSummary(data.summary);
      })
      .catch(() => {
        // Non-fatal — the panel simply falls back to "No monitoring data".
        if (!cancelled) setMetricsSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [site]);

  if (!site && !isLoading) return null;

  const project = site ? getProjectById(site.project_id) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-primary/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={site ? `${site.name} details` : 'Site details'}
        className="relative w-full sm:w-[420px] h-full bg-surface-container-lowest shadow-xl overflow-y-auto animate-slide-in-right"
      >
        <div className="flex items-center justify-between px-space-lg py-space-md border-b border-outline-variant/30 sticky top-0 bg-surface-container-lowest">
          <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
            Site Details
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {isLoading || !site ? (
          <SitePanelSkeleton />
        ) : (
          <div className="p-space-lg">
            <div className="flex items-center justify-between mb-space-sm">
              <span className="px-space-xs py-0.5 rounded bg-primary-fixed text-primary font-label-technical text-label-micro">
                {site.status === 'Verified' ? 'VERIFIED PARCEL' : site.status.toUpperCase()}
              </span>
              <StatusBadge status={site.status} />
            </div>

            <h2 className="font-headline-lg text-headline-lg text-primary mb-1">{site.name}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
              {site.description}
            </p>

            <div className="space-y-space-sm mb-space-lg">
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                  Project
                </span>
                <span className="font-body-sm text-body-sm text-primary font-medium truncate max-w-[220px]">
                  {project?.name ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                  Area
                </span>
                <span className="font-headline-sm text-headline-sm text-primary">
                  {site.area_hectares.toLocaleString()} ha
                </span>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                  Perimeter
                </span>
                <span className="font-headline-sm text-headline-sm text-primary">
                  {site.perimeter_km.toLocaleString()} km
                </span>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                  Centroid
                </span>
                <span className="font-body-sm text-body-sm text-primary font-medium">
                  {site.centroid.lat.toFixed(4)}, {site.centroid.lon.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                  Carbon Impact
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                  {metricsSummary?.carbon_total != null
                    ? `${metricsSummary.carbon_total.toLocaleString()} tCO\u2082e`
                    : 'No monitoring data'}
                </span>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                  Biodiversity
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                  {metricsSummary?.biodiversity_current != null
                    ? `${metricsSummary.biodiversity_current} / 100`
                    : 'No monitoring data'}
                </span>
              </div>
            </div>

            <div className="space-y-space-xs">
              <button
                type="button"
                onClick={() => navigate(`/sites/${site.id}`)}
                className="w-full bg-primary-container text-on-primary py-space-sm rounded-lg font-headline-sm text-body-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  query_stats
                </span>
                View Site Analytics
              </button>
              <button
                type="button"
                onClick={() => navigate('/sites')}
                className="w-full bg-surface-container text-primary py-space-sm rounded-lg font-headline-sm text-body-sm flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  list
                </span>
                View All Sites
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
