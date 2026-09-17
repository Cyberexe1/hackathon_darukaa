import type { DashboardOverview } from '../types/dashboard';
import { mockProjects } from './mockProjects';
import { mockSites } from './mockSites';
import { mockLatestSiteMetrics } from './mockMetrics';

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Derives dashboard-level KPI aggregates from the underlying mock records. */
export function getMockDashboardOverview(): DashboardOverview {
  const totalArea = mockProjects.reduce((sum, p) => sum + p.total_area_hectares, 0);
  const totalCarbon = mockLatestSiteMetrics.reduce((sum, m) => sum + m.carbon_tco2e, 0);
  const avgBio =
    mockLatestSiteMetrics.reduce((sum, m) => sum + m.biodiversity_score, 0) / mockLatestSiteMetrics.length;
  const avgVeg =
    mockLatestSiteMetrics.reduce((sum, m) => sum + m.vegetation_index, 0) / mockLatestSiteMetrics.length;
  const activeSites = mockSites.filter((s) => s.status === 'Active' || s.status === 'Verified').length;
  const projectsThisYear = mockProjects.filter((p) => p.start_date.startsWith('2026')).length;

  return {
    total_projects: mockProjects.length,
    total_sites: mockSites.length,
    total_area_hectares: round(totalArea, 0),
    total_carbon_tco2e: round(totalCarbon, 0),
    avg_biodiversity_score: round(avgBio, 0),
    avg_vegetation_index: round(avgVeg, 2),
    active_sites: activeSites,
    projects_this_year: projectsThisYear,
  };
}
