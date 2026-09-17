import { useEffect, useState } from 'react';
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
import { TableSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';
import { useProjectStore } from '../../store/projectStore';
import { useMapStore } from '../../store/mapStore';
import { useSiteStore } from '../../store/siteStore';

/**
 * /dashboard — the authenticated environmental intelligence overview.
 * Primary KPI row (animated counters), secondary indicator row, the main
 * geospatial map with site polygons, and a recent projects table.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { projects, isLoading, error, fetchProjects } = useProjectStore();
  const { sites, fetchSites, getSiteById } = useSiteStore();
  const selectedSiteId = useMapStore((state) => state.selectedSiteId);
  const setSelectedSiteId = useMapStore((state) => state.setSelectedSiteId);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchSites();
  }, [fetchProjects, fetchSites]);

  // Database-driven KPIs derived directly from the project/site stores —
  // no fabricated carbon/biodiversity numbers. Those metrics aren't
  // implemented yet, so they intentionally show "No monitoring data"
  // rather than invented figures.
  const totalArea = sites.reduce((sum, s) => sum + s.area_hectares, 0);
  const activeSites = sites.filter((s) => s.status === 'Active' || s.status === 'Verified').length;

  const selectedSite = selectedSiteId ? getSiteById(selectedSiteId) ?? null : null;
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout pageTitle="Environmental Overview">
      <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-space-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-1">Environmental Overview</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Monitor your projects, sites and environmental impact from one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="group inline-flex items-center justify-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-200 hover:bg-primary shadow-md shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
            Create Project
          </button>
        </div>

        {/* Primary KPI row — all derived directly from the database via projectStore/siteStore. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <KpiCard icon="forest" label="Total Projects" target={projects.length} description="Environmental projects in your portfolio." />
          <KpiCard icon="pin_drop" label="Total Sites" target={sites.length} description="Geographical sites being monitored." />
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
            staticValue="—"
            tone="accent"
            description="No monitoring data"
          />
        </div>

        {/* Secondary indicator row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter-sm">
          <CompactKpiCard icon="eco" label="Biodiversity Score" value="No monitoring data" />
          <CompactKpiCard icon="grass" label="Vegetation Index" value="No monitoring data" />
          <CompactKpiCard icon="check_circle" label="Active Sites" value={String(activeSites)} />
          <CompactKpiCard icon="folder" label="Projects" value={String(projects.length)} />
        </div>

        {/* Main geospatial map */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-sm md:p-space-md">
          <div className="flex items-center justify-between mb-space-sm px-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary">Project &amp; Site Map</h3>
            <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
              {sites.length} {sites.length === 1 ? 'site' : 'sites'}
            </span>
          </div>
          <MapView
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSiteSelect={setSelectedSiteId}
            className="h-[380px] md:h-[480px]"
            initialZoom={2.2}
          />
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
            <ErrorState title="Unable to load project data." description={error} onRetry={fetchProjects} />
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
          {!isLoading && !error && recentProjects.length > 0 && <ProjectTable projects={recentProjects} />}
        </div>
      </div>

      <SiteDetailsPanel site={selectedSite} onClose={() => setSelectedSiteId(null)} />

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Project">
        <ProjectForm onCancel={() => setCreateOpen(false)} onSuccess={() => setCreateOpen(false)} />
      </Modal>
    </DashboardLayout>
  );
}
