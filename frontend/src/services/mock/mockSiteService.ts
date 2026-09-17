import type { GeoJSONPolygon, Site, SiteStatus } from '../../types/dashboard';
import { mockSites, getSiteById, getSitesByProjectId } from '../../mocks/mockSites';
import { getLatestMetricForSite } from '../../mocks/mockMetrics';

const LATENCY_MS = 350;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let sites: Site[] = [...mockSites];

export interface CreateSiteInput {
  project_id: string;
  name: string;
  description: string;
  geometry: GeoJSONPolygon;
  area_hectares: number;
  perimeter_km: number;
  centroid: { lat: number; lon: number };
  status: SiteStatus;
}

/**
 * Mock implementation of the site service. In production, `createSite`
 * will POST the drawn GeoJSON polygon to FastAPI, which persists it as a
 * PostGIS geometry column. Here we just append to the in-memory list.
 */
export const mockSiteService = {
  async getSites(): Promise<Site[]> {
    return delay([...sites]);
  },

  async getSiteById(id: string): Promise<Site | undefined> {
    return delay(getSiteById(id) ?? sites.find((s) => s.id === id));
  },

  async getSitesByProjectId(projectId: string): Promise<Site[]> {
    return delay(getSitesByProjectId(projectId).length ? getSitesByProjectId(projectId) : sites.filter((s) => s.project_id === projectId));
  },

  async createSite(input: CreateSiteInput): Promise<Site> {
    const newSite: Site = {
      id: `site-${Date.now()}`,
      project_id: input.project_id,
      name: input.name,
      description: input.description,
      area_hectares: input.area_hectares,
      perimeter_km: input.perimeter_km,
      centroid: input.centroid,
      geometry: input.geometry,
      status: input.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    sites = [newSite, ...sites];
    return delay(newSite, 600);
  },

  async getLatestMetric(siteId: string) {
    return delay(getLatestMetricForSite(siteId));
  },
};
