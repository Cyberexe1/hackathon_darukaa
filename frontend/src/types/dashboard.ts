// Domain model types for the authenticated Darukaa.Earth dashboard.
// These are designed to map 1:1 onto the eventual FastAPI + PostGIS
// backend schema, so that swapping the mock service layer for real API
// calls requires no changes to component code.

/** A GeoJSON Polygon geometry, matching what PostGIS will store/return. */
export interface GeoJSONPolygon {
  type: 'Polygon';
  /** Array of linear rings; first ring is the outer boundary. */
  coordinates: number[][][];
}

export type ProjectType =
  | 'Forest Restoration'
  | 'Mangrove'
  | 'Biodiversity'
  | 'Agroforestry'
  | 'Wetland Conservation';

export type ProjectStatus = 'Active' | 'Planning' | 'Completed' | 'Paused';

export type SiteStatus = 'Active' | 'Verified' | 'In Review' | 'Paused';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'auditor';
  avatarInitials: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  project_type: ProjectType;
  status: ProjectStatus;
  country: string;
  region: string;
  start_date: string;
  end_date: string | null;
  /** Denormalized counts, computed on the backend for list views. */
  site_count: number;
  total_area_hectares: number;
  updated_at: string;
}

export interface Site {
  id: string;
  project_id: string;
  name: string;
  description: string;
  area_hectares: number;
  perimeter_km: number;
  centroid: { lat: number; lon: number };
  geometry: GeoJSONPolygon;
  status: SiteStatus;
  created_at: string;
  updated_at: string;
}

export interface SiteMetric {
  id: string;
  site_id: string;
  recorded_at: string;
  carbon_tco2e: number;
  biodiversity_score: number;
  vegetation_index: number;
  tree_cover_percentage: number;
}

export type SiteEventType = 'created' | 'updated' | 'boundary_saved' | 'analytics_synced';

export interface SiteEvent {
  id: string;
  site_id: string | null;
  project_id: string | null;
  event_type: SiteEventType;
  message: string;
  created_at: string;
}

/** Time-series point used by analytics charts (Highcharts-ready). */
export interface MetricYearPoint {
  year: number;
  value: number;
}

/** Combined analytics payload for a single site across all tracked years. */
export interface SiteAnalytics {
  site_id: string;
  carbon: MetricYearPoint[];
  biodiversity: MetricYearPoint[];
  vegetation: MetricYearPoint[];
}

/** Aggregate KPI figures shown on the dashboard overview. */
export interface DashboardOverview {
  total_projects: number;
  total_sites: number;
  total_area_hectares: number;
  total_carbon_tco2e: number;
  avg_biodiversity_score: number;
  avg_vegetation_index: number;
  active_sites: number;
  projects_this_year: number;
}

export interface PerformanceSummary {
  carbon_change_pct: number;
  biodiversity_change_pct: number;
  vegetation_change_pct: number;
  area_hectares: number;
}
