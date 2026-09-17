import { apiClient } from './apiClient';
import type { Project, ProjectStatus, ProjectType } from '../types/dashboard';

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

export type UpdateProjectInput = Partial<CreateProjectInput>;

// Real Axios-backed project service, wired to the FastAPI + PostGIS
// backend (see backend/app/api/routes/projects.py). `created_by` is never
// sent from the client — the backend derives project ownership from the
// JWT bearer token attached by `apiClient`'s request interceptor.
export const projectService = {
  async getProjects(): Promise<Project[]> {
    const { data } = await apiClient.get<Project[]>('/projects');
    return data;
  },

  async getProjectById(id: string): Promise<Project> {
    const { data } = await apiClient.get<Project>(`/projects/${id}`);
    return data;
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const { data } = await apiClient.post<Project>('/projects', input);
    return data;
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const { data } = await apiClient.patch<Project>(`/projects/${id}`, input);
    return data;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },
};
