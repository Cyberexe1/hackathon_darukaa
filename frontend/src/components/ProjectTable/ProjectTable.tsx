import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types/dashboard';
import { StatusBadge } from '../StatusBadge/StatusBadge';

interface ProjectTableProps {
  projects: Project[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Responsive project table: full table on md+, stacked cards on mobile
 * to avoid unintended horizontal scrolling on narrow viewports.
 */
export function ProjectTable({ projects }: ProjectTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low font-label-technical text-label-micro text-on-surface-variant uppercase">
              <th scope="col" className="py-space-sm px-space-lg">Project</th>
              <th scope="col" className="py-space-sm px-space-md">Type</th>
              <th scope="col" className="py-space-sm px-space-md">Sites</th>
              <th scope="col" className="py-space-sm px-space-md">Area</th>
              <th scope="col" className="py-space-sm px-space-md">Status</th>
              <th scope="col" className="py-space-sm px-space-lg">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
            {projects.map((project) => (
              <tr
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
              >
                <td className="py-space-md px-space-lg">
                  <div className="font-headline-sm text-headline-sm text-primary">{project.name}</div>
                  <div className="font-label-technical text-label-micro text-on-surface-variant">
                    {project.region}, {project.country}
                  </div>
                </td>
                <td className="py-space-md px-space-md text-on-surface">{project.project_type}</td>
                <td className="py-space-md px-space-md text-primary font-medium">{project.site_count}</td>
                <td className="py-space-md px-space-md text-primary font-medium">
                  {project.total_area_hectares.toLocaleString()} ha
                </td>
                <td className="py-space-md px-space-md">
                  <StatusBadge status={project.status} />
                </td>
                <td className="py-space-md px-space-lg font-label-technical text-label-micro text-on-surface-variant">
                  {formatDate(project.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden divide-y divide-outline-variant/20">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => navigate(`/projects/${project.id}`)}
            className="w-full text-left p-space-md hover:bg-surface-container-low/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-headline-sm text-headline-sm text-primary">{project.name}</span>
              <StatusBadge status={project.status} />
            </div>
            <p className="font-label-technical text-label-micro text-on-surface-variant mb-space-sm">
              {project.project_type} &middot; {project.region}, {project.country}
            </p>
            <div className="flex items-center gap-space-md font-body-sm text-body-sm">
              <span className="text-on-surface-variant">Sites: <span className="text-primary font-medium">{project.site_count}</span></span>
              <span className="text-on-surface-variant">Area: <span className="text-primary font-medium">{project.total_area_hectares.toLocaleString()} ha</span></span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
