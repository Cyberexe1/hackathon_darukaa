import { apiClient } from './apiClient';
import type { GeoJSONPolygon, Site, SiteStatus } from '../types/dashboard';

export interface CreateSiteInput {
  project_id: string;
  name: string;
  description: string;
  status: SiteStatus;
  /** Raw GeoJSON polygon drawn via Mapbox GL Draw. The backend is the
   * sole authority on area_hectares/perimeter_km/centroid — it recomputes
   * them from this geometry via PostGIS rather than trusting client math. */
  geometry: GeoJSONPolygon;
}

export interface UpdateSiteInput {
  name?: string;
  description?: string;
  status?: SiteStatus;
  geometry?: GeoJSONPolygon;
}

// Real Axios-backed site service. `createSite` posts the Mapbox Draw
// GeoJSON polygon straight through to FastAPI, which validates it and
// persists it as a PostGIS geometry column (see
// backend/app/services/geospatial_service.py). The frontend never stores
// or sends geometry as anything other than a GeoJSON payload in transit.
export const siteService = {
  async getSites(): Promise<Site[]> {
    const { data } = await apiClient.get<Site[]>('/sites');
    return data;
  },

  async getSiteById(id: string): Promise<Site> {
    const { data } = await apiClient.get<Site>(`/sites/${id}`);
    return data;
  },

  async getSitesByProjectId(projectId: string): Promise<Site[]> {
    const { data } = await apiClient.get<Site[]>('/sites', { params: { project_id: projectId } });
    return data;
  },

  async createSite(input: CreateSiteInput): Promise<Site> {
    const { data } = await apiClient.post<Site>('/sites', input);
    return data;
  },

  async updateSite(id: string, input: UpdateSiteInput): Promise<Site> {
    const { data } = await apiClient.patch<Site>(`/sites/${id}`, input);
    return data;
  },

  async deleteSite(id: string): Promise<void> {
    await apiClient.delete(`/sites/${id}`);
  },
};
