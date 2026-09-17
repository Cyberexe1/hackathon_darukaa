import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout/DashboardLayout';
import { ProjectTable } from '../../components/ProjectTable/ProjectTable';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { TableSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';
import { Modal } from '../../components/Modal/Modal';
import { ProjectForm } from '../../components/ProjectForm/ProjectForm';
import { useProjectStore } from '../../store/projectStore';

/** /projects — full project registry with search-free table view and Create Project entry point. */
export function ProjectsPage() {
  const { projects, isLoading, error, hasLoaded, fetchProjects } = useProjectStore();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <DashboardLayout pageTitle="Projects">
      <div className="p-4 md:p-space-lg max-w-[1600px] mx-auto flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-space-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-1">Projects</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Environmental restoration and conservation projects across your portfolio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-space-sm bg-primary-container text-on-primary px-space-lg py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-200 hover:bg-primary shadow-md shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
            Create Project
          </button>
        </div>

        {isLoading && <TableSkeleton rows={6} />}

        {!isLoading && error && (
          <ErrorState title="Unable to load project data." description={error} onRetry={fetchProjects} />
        )}

        {!isLoading && !error && hasLoaded && projects.length === 0 && (
          <EmptyState
            icon="forest"
            title="No projects yet."
            description="Create your first environmental project to start mapping sites and tracking impact."
            actionLabel="Create Your First Project"
            onAction={() => setCreateOpen(true)}
          />
        )}

        {!isLoading && !error && projects.length > 0 && <ProjectTable projects={projects} />}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Project">
        <ProjectForm onCancel={() => setCreateOpen(false)} onSuccess={() => setCreateOpen(false)} />
      </Modal>
    </DashboardLayout>
  );
}
