import { create } from 'zustand';
import type { Site } from '../types/dashboard';
import { siteService, type CreateSiteInput, type UpdateSiteInput } from '../services/siteService';
import { getApiErrorMessage } from '../services/apiError';

interface SiteState {
  sites: Site[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  fetchSites: () => Promise<void>;
  /** Fetches and caches a single site by id — used when a site detail
   * route is opened directly (e.g. browser refresh) and the list hasn't
   * been loaded yet. Throws on 404/403 so the page can render its own
   * not-found/error state. */
  fetchSiteById: (id: string) => Promise<Site>;
  addSite: (input: CreateSiteInput) => Promise<Site>;
  updateSite: (id: string, input: UpdateSiteInput) => Promise<Site>;
  deleteSite: (id: string) => Promise<void>;
  getSiteById: (id: string) => Site | undefined;
  getSitesByProjectId: (projectId: string) => Site[];
}

/**
 * Single source of truth for site records across the dashboard (map
 * views, tables, site details). Backed by the real FastAPI `siteService`,
 * which persists the drawn polygon to PostGIS on Neon and returns the
 * backend-computed area/perimeter/centroid. Centralizing here (rather
 * than every page fetching independently) ensures a site created via the
 * Add Site flow immediately appears on every map/table without a reload.
 */
export const useSiteStore = create<SiteState>((set, get) => ({
  sites: [],
  isLoading: false,
  error: null,
  hasLoaded: false,

  fetchSites: async () => {
    if (get().hasLoaded || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const sites = await siteService.getSites();
      set({ sites, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Unable to load site data.'), isLoading: false });
    }
  },

  fetchSiteById: async (id) => {
    const site = await siteService.getSiteById(id);
    set((state) => ({
      sites: state.sites.some((s) => s.id === id)
        ? state.sites.map((s) => (s.id === id ? site : s))
        : [...state.sites, site],
    }));
    return site;
  },

  addSite: async (input) => {
    const created = await siteService.createSite(input);
    set((state) => ({ sites: [created, ...state.sites] }));
    return created;
  },

  updateSite: async (id, input) => {
    const updated = await siteService.updateSite(id, input);
    set((state) => ({ sites: state.sites.map((s) => (s.id === id ? updated : s)) }));
    return updated;
  },

  deleteSite: async (id) => {
    await siteService.deleteSite(id);
    set((state) => ({ sites: state.sites.filter((s) => s.id !== id) }));
  },

  getSiteById: (id) => get().sites.find((s) => s.id === id),
  getSitesByProjectId: (projectId) => get().sites.filter((s) => s.project_id === projectId),
}));
