import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Site } from '../../types/dashboard';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
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

  useEffect(() => {
    if (!site && !isLoading) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [site, isLoading, onClose]);

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
                  Carbon Impact
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                  No monitoring data
                </span>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                  Biodiversity
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                  No monitoring data
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
                View Analytics
              </button>
              <button
                type="button"
                onClick={() => navigate('/sites')}
                className="w-full bg-surface-container text-primary py-space-sm rounded-lg font-headline-sm text-body-sm flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  edit
                </span>
                Edit Site
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
