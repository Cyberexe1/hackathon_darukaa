import type { Project, ProjectStatus, ProjectType } from '../../types/dashboard';
import { mockProjects, getProjectById } from '../../mocks/mockProjects';

// Simulated network latency so loading skeletons have something to show.
const LATENCY_MS = 350;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let projects: Project[] = [...mockProjects];

export interface CreateProjectInput {
  name: string;
  description: string;
  project_type: ProjectType;
  country: string;
  region: string;
  start_date: string;
  end_date: string | null;
  status: ProjectStatus;
}

/**
 * Mock implementation of the project service. Mirrors the shape the real
 * Axios-backed `projectService` will expose once FastAPI endpoints exist,
 * so call sites don't need to change when swapped in.
 */
export const mockProjectService = {
  async getProjects(): Promise<Project[]> {
    return delay([...projects]);
  },

  async getProjectById(id: string): Promise<Project | undefined> {
    return delay(getProjectById(id) ?? projects.find((p) => p.id === id));
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: input.name,
      description: input.description,
      project_type: input.project_type,
      status: input.status,
      country: input.country,
      region: input.region,
      start_date: input.start_date,
      end_date: input.end_date,
      site_count: 0,
      total_area_hectares: 0,
      updated_at: new Date().toISOString(),
    };
    projects = [newProject, ...projects];
    return delay(newProject, 600);
  },
};
