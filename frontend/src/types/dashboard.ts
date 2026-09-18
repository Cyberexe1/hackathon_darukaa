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

/** A GeoJSON Point geometry — [longitude, latitude]. Not currently used
 * for `Site.centroid` (which uses the more ergonomic `{ lat, lon }` shape
 * consistently across this codebase's types/components/backend schema),
 * but provided for any future API surface that returns a centroid/marker
 * as standard GeoJSON. */
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
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
  /** ISO date (YYYY-MM-DD) the measurement represents. */
  recorded_at: string;
  carbon_tco2e: number;
  /** 0-100. */
  biodiversity_score: number;
  /** Normalized index, 0-1. */
  vegetation_index: number;
  /** 0-100. */
  tree_cover_percentage: number;
  created_at: string;
  updated_at: string;
}

/** Payload for creating/editing a measurement via the Add/Edit Measurement UI. */
export interface SiteMetricInput {
  recorded_at: string;
  carbon_tco2e: number;
  biodiversity_score: number;
  vegetation_index: number;
  tree_cover_percentage: number;
}

/**
 * Real analytics response types, matching the FastAPI response schemas
 * exactly (see backend/app/schemas/analytics.py). Unlike the legacy
 * `DashboardOverview`/`PerformanceSummary`/`SiteAnalytics` types below
 * (kept only for the now-unused mock data layer), every numeric field
 * here that can't yet be computed from real data is `null` — the UI must
 * render "No data available" / "Insufficient historical data" rather
 * than treating `null` as zero.
 */
export interface SiteAnalyticsSite {
  id: string;
  name: string;
  area_hectares: number;
  status: string;
}

export interface SiteAnalyticsSummary {
  carbon_total: number | null;
  biodiversity_current: number | null;
  vegetation_current: number | null;
  tree_cover_current: number | null;
  first_recorded_at: string | null;
  last_recorded_at: string | null;
}

export interface PerformanceChange {
  has_sufficient_data: boolean;
  carbon_change_pct: number | null;
  biodiversity_change_pct: number | null;
  vegetation_change_pct: number | null;
  tree_cover_change_pct: number | null;
}

export interface SiteAnalyticsResponse {
  site: SiteAnalyticsSite;
  summary: SiteAnalyticsSummary;
  performance: PerformanceChange;
  /** Sorted ascending by recorded_at. Empty when the site has no metrics. */
  historical: SiteMetric[];
}

/** One bucketed year of metrics aggregated across multiple sites (sum for
 * carbon, average for the rest) — used for project/dashboard-level trend
 * charts, since records from different sites rarely share an exact date. */
export interface YearAggregatePoint {
  year: number;
  carbon_tco2e: number;
  biodiversity_score: number;
  vegetation_index: number;
  tree_cover_percentage: number;
}

export interface ProjectAnalyticsProject {
  id: string;
  name: string;
  site_count: number;
  total_area_hectares: number;
  status: string;
}

export interface ProjectAnalyticsSummary {
  carbon_total: number | null;
  avg_biodiversity_score: number | null;
  avg_vegetation_index: number | null;
  avg_tree_cover_percentage: number | null;
}

export interface ProjectAnalyticsResponse {
  project: ProjectAnalyticsProject;
  summary: ProjectAnalyticsSummary;
  historical: YearAggregatePoint[];
}

export interface DashboardAnalyticsResponse {
  total_projects: number;
  total_sites: number;
  total_area_hectares: number;
  active_sites: number;
  carbon_total: number | null;
  avg_biodiversity_score: number | null;
  avg_vegetation_index: number | null;
  avg_tree_cover_percentage: number | null;
  historical: YearAggregatePoint[];
}

/** Time range filter for historical analytics views. */
export type AnalyticsTimeRange = '1y' | '3y' | '5y' | 'all';

export type SiteEventType = 'created' | 'updated' | 'boundary_saved' | 'analytics_synced';

export interface SiteEvent {
  id: string;
  site_id: string | null;
  project_id: string | null;
  event_type: SiteEventType;
  message: string;
  created_at: string;
}

/** Generic labeled data point used by the shared Highcharts components
 * (CarbonChart, BiodiversityChart, etc). `label` is either an ISO date
 * (site-level historical data) or a year string (project/dashboard-level
 * aggregated data) — charts just render it as an x-axis category. */
export interface ChartPoint {
  label: string;
  value: number;
}
