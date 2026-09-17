import { useNavigate } from 'react-router-dom';
import type { Site } from '../../types/dashboard';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { useProjectStore } from '../../store/projectStore';

interface SiteTableProps {
  sites: Site[];
  /** Hide the Project column when already scoped to a single project (e.g. ProjectDetailPage). */
  showProjectColumn?: boolean;
}

/**
 * Responsive site table: full table on md+, stacked cards on mobile.
 * Carbon/biodiversity columns show "—" — environmental monitoring data
 * isn't implemented yet (see /sites/:siteId for the same empty state).
 */
export function SiteTable({ sites, showProjectColumn = true }: SiteTableProps) {
  const navigate = useNavigate();
  const getProjectById = useProjectStore((state) => state.getProjectById);

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low font-label-technical text-label-micro text-on-surface-variant uppercase">
              <th scope="col" className="py-space-sm px-space-lg">Site</th>
              {showProjectColumn && <th scope="col" className="py-space-sm px-space-md">Project</th>}
              <th scope="col" className="py-space-sm px-space-md">Area</th>
              <th scope="col" className="py-space-sm px-space-md">Carbon</th>
              <th scope="col" className="py-space-sm px-space-md">Biodiversity</th>
              <th scope="col" className="py-space-sm px-space-md">Status</th>
              <th scope="col" className="py-space-sm px-space-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
            {sites.map((site) => {
              const project = getProjectById(site.project_id);
              return (
                <tr key={site.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-space-md px-space-lg">
                    <div className="font-headline-sm text-headline-sm text-primary">{site.name}</div>
                    <div className="font-label-technical text-label-micro text-on-surface-variant">
                      {site.centroid.lat.toFixed(3)}&deg;, {site.centroid.lon.toFixed(3)}&deg;
                    </div>
                  </td>
                  {showProjectColumn && (
                    <td className="py-space-md px-space-md text-on-surface">{project?.name ?? '—'}</td>
                  )}
                  <td className="py-space-md px-space-md text-primary font-medium">{site.area_hectares.toLocaleString()} ha</td>
                  <td className="py-space-md px-space-md text-on-surface-variant">—</td>
                  <td className="py-space-md px-space-md text-on-surface-variant">—</td>
                  <td className="py-space-md px-space-md">
                    <StatusBadge status={site.status} />
                  </td>
                  <td className="py-space-md px-space-lg text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/sites/${site.id}`)}
                      className="text-surface-tint hover:text-primary font-label-technical text-label-micro"
                    >
                      VIEW ANALYTICS &rarr;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-outline-variant/20">
        {sites.map((site) => (
          <button
            key={site.id}
            type="button"
            onClick={() => navigate(`/sites/${site.id}`)}
            className="w-full text-left p-space-md hover:bg-surface-container-low/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-headline-sm text-headline-sm text-primary">{site.name}</span>
              <StatusBadge status={site.status} />
            </div>
            <div className="flex items-center gap-space-md font-body-sm text-body-sm text-on-surface-variant">
              <span>Area: <span className="text-primary font-medium">{site.area_hectares.toLocaleString()} ha</span></span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
