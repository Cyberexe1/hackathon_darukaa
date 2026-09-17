import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout/DashboardLayout';
import { SiteTable } from '../../components/SiteTable/SiteTable';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { TableSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';
import { AddSiteFlow } from '../../components/AddSiteFlow/AddSiteFlow';
import { useSiteStore } from '../../store/siteStore';

/** /sites — site registry with the multi-step Add Site flow entry point. */
export function SitesPage() {
  const { sites, isLoading, error, hasLoaded, fetchSites } = useSiteStore();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return (
    <DashboardLayout pageTitle="Sites">
      <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-space-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-1">Sites</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Manage geographical areas associated with your environmental projects.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center justify-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-200 hover:bg-primary shadow-md shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
            Add Site
          </button>
        </div>

        {isLoading && <TableSkeleton rows={6} />}

        {!isLoading && error && (
          <ErrorState title="Unable to load site data." description={error} onRetry={fetchSites} />
        )}

        {!isLoading && !error && hasLoaded && sites.length === 0 && (
          <EmptyState
            icon="pin_drop"
            title="No geographical sites have been added."
            description="Add a site to draw its boundary and start tracking carbon and biodiversity metrics."
            actionLabel="Add Site"
            onAction={() => setAddOpen(true)}
          />
        )}

        {!isLoading && !error && sites.length > 0 && <SiteTable sites={sites} />}
      </div>

      <AddSiteFlow isOpen={addOpen} onClose={() => setAddOpen(false)} />
    </DashboardLayout>
  );
}
