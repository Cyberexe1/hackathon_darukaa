import { create } from 'zustand';
import type { Project } from '../types/dashboard';
import {
  projectService,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '../services/projectService';
import { getApiErrorMessage } from '../services/apiError';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  fetchProjects: () => Promise<void>;
  /** Fetches and caches a single project by id — used when a project detail
   * route is opened directly (e.g. browser refresh) and the list hasn't
   * been loaded into the store yet. Throws on 404/403 so the page can
   * render its own not-found/error state. */
  fetchProjectById: (id: string) => Promise<Project>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
}

/**
 * Single source of truth for project records across the dashboard (list
 * views, project detail, Add Site's project picker). Backed by the real
 * FastAPI `projectService` — `createProject`/`updateProject`/
 * `deleteProject` all persist to Neon Postgres first, then reconcile
 * local state from the server response so every consumer of this store
 * reflects the true saved state (no optimistic-only writes).
 */
export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  hasLoaded: false,

  fetchProjects: async () => {
    if (get().hasLoaded || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const projects = await projectService.getProjects();
      set({ projects, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Unable to load project data.'), isLoading: false });
    }
  },

  fetchProjectById: async (id) => {
    const project = await projectService.getProjectById(id);
    set((state) => ({
      projects: state.projects.some((p) => p.id === id)
        ? state.projects.map((p) => (p.id === id ? project : p))
        : [...state.projects, project],
    }));
    return project;
  },

  createProject: async (input) => {
    const created = await projectService.createProject(input);
    set((state) => ({ projects: [created, ...state.projects] }));
    return created;
  },

  updateProject: async (id, input) => {
    const updated = await projectService.updateProject(id, input);
    set((state) => ({ projects: state.projects.map((p) => (p.id === id ? updated : p)) }));
    return updated;
  },

  deleteProject: async (id) => {
    await projectService.deleteProject(id);
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
  },

  getProjectById: (id) => get().projects.find((p) => p.id === id),
}));
