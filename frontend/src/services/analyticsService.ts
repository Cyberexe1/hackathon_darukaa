import { apiClient } from './apiClient';
import type {
  DashboardAnalyticsResponse,
  ProjectAnalyticsResponse,
  SiteAnalyticsResponse,
  SiteMetric,
  SiteMetricInput,
} from '../types/dashboard';

// Real Axios-backed analytics service, wired to the FastAPI + PostGIS
// backend (see backend/app/api/routes/analytics.py and metrics.py). All
// aggregation happens server-side (SQL SUM/AVG over stored site_metrics
// rows) — this file only shapes the HTTP calls, never computes analytics
// client-side.
export const analyticsService = {
  async getSiteAnalytics(siteId: string): Promise<SiteAnalyticsResponse> {
    const { data } = await apiClient.get<SiteAnalyticsResponse>(`/sites/${siteId}/analytics`);
    return data;
  },

  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsResponse> {
    const { data } = await apiClient.get<ProjectAnalyticsResponse>(
      `/projects/${projectId}/analytics`,
    );
    return data;
  },

  async getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
    const { data } = await apiClient.get<DashboardAnalyticsResponse>('/analytics/dashboard');
    return data;
  },

  async getMetrics(siteId: string): Promise<SiteMetric[]> {
    const { data } = await apiClient.get<SiteMetric[]>(`/sites/${siteId}/metrics`);
    return data;
  },

  async createMetric(siteId: string, input: SiteMetricInput): Promise<SiteMetric> {
    const { data } = await apiClient.post<SiteMetric>(`/sites/${siteId}/metrics`, input);
    return data;
  },

  async updateMetric(
    siteId: string,
    metricId: string,
    input: Partial<SiteMetricInput>,
  ): Promise<SiteMetric> {
    const { data } = await apiClient.patch<SiteMetric>(
      `/sites/${siteId}/metrics/${metricId}`,
      input,
    );
    return data;
  },

  async deleteMetric(siteId: string, metricId: string): Promise<void> {
    await apiClient.delete(`/sites/${siteId}/metrics/${metricId}`);
  },
};
