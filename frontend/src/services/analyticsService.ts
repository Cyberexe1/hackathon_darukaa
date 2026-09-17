import { apiClient } from './apiClient';
import type { DashboardOverview, PerformanceSummary, SiteAnalytics } from '../types/dashboard';

// Real Axios-backed analytics service, mirrored against `mockAnalyticsService`.
export const analyticsService = {
  async getSiteAnalytics(siteId: string): Promise<SiteAnalytics> {
    const { data } = await apiClient.get<SiteAnalytics>(`/sites/${siteId}/analytics`);
    return data;
  },

  async getAllSiteAnalytics(): Promise<SiteAnalytics[]> {
    const { data } = await apiClient.get<SiteAnalytics[]>('/analytics/sites');
    return data;
  },

  async getSitePerformanceSummary(siteId: string): Promise<PerformanceSummary> {
    const { data } = await apiClient.get<PerformanceSummary>(`/sites/${siteId}/analytics/summary`);
    return data;
  },

  async getDashboardOverview(): Promise<DashboardOverview> {
    const { data } = await apiClient.get<DashboardOverview>('/analytics/overview');
    return data;
  },
};
