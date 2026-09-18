import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SiteAnalyticsPage } from './SiteAnalyticsPage';
import type { Site, SiteAnalyticsResponse } from '../../types/dashboard';

// `mapbox-gl` requires a real WebGL context, unavailable in jsdom — same
// mock used by MapView.test.tsx/DrawMap.test.tsx.
vi.mock('mapbox-gl', async () => {
  const mod = await import('../../test/mocks/mapboxgl');
  return { default: mod.default };
});

// AddSiteFlow (used here in "edit" mode) pulls in DrawMap ->
// @mapbox/mapbox-gl-draw, which isn't relevant to what this page's own
// tests need to verify — mocked at the component boundary so we can just
// assert it opens/receives the right `site` prop, consistent with how
// AddSiteFlow.test.tsx mocks its own DrawMap child.
const { addSiteFlowPropsSpy, carbonChartPropsSpy } = vi.hoisted(() => ({
  addSiteFlowPropsSpy: vi.fn(),
  carbonChartPropsSpy: vi.fn(),
}));
vi.mock('../../components/AddSiteFlow/AddSiteFlow', () => ({
  AddSiteFlow: (props: { isOpen: boolean; site?: Site | null }) => {
    addSiteFlowPropsSpy(props);
    return props.isOpen ? <div data-testid="edit-site-flow-stub" /> : null;
  },
}));

// The "time range" test needs to see exactly what data reaches a chart
// after filtering — spying on the real CarbonChart (which renders real
// Highcharts SVG, awkward to assert against directly) would be brittle.
// Stubbing it at the component boundary, same pattern as AddSiteFlow's
// DrawMap mock, keeps the assertion about *this page's* filtering logic
// rather than Highcharts' rendering.
vi.mock('../../components/charts/CarbonChart', () => ({
  CarbonChart: (props: { data: { label: string; value: number }[] }) => {
    carbonChartPropsSpy(props);
    return <div data-testid="carbon-chart-stub">{props.data.length} points</div>;
  },
}));

const TEST_SITE: Site = {
  id: 'site-1',
  project_id: 'proj-1',
  name: 'Test Site A',
  description: 'A test site.',
  area_hectares: 12.43,
  perimeter_km: 1.872,
  centroid: { lat: 19.11, lon: 72.81 },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [72.8, 19.1],
        [72.81, 19.1],
        [72.81, 19.11],
        [72.8, 19.11],
        [72.8, 19.1],
      ],
    ],
  },
  status: 'Active',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

const TEST_PROJECT = {
  id: 'proj-1',
  name: 'Test Project',
  description: '',
  project_type: 'Forest Restoration' as const,
  status: 'Active' as const,
  country: 'India',
  region: 'Maharashtra',
  start_date: '2024-01-01',
  end_date: null,
  site_count: 1,
  total_area_hectares: 12.43,
  updated_at: '2024-01-15T00:00:00Z',
};

function makeAnalytics(overrides: Partial<SiteAnalyticsResponse> = {}): SiteAnalyticsResponse {
  return {
    site: {
      id: TEST_SITE.id,
      name: TEST_SITE.name,
      area_hectares: TEST_SITE.area_hectares,
      status: TEST_SITE.status,
    },
    summary: {
      carbon_total: 205.4,
      biodiversity_current: 74.2,
      vegetation_current: 0.68,
      tree_cover_current: 61,
      first_recorded_at: '2022-01-01',
      last_recorded_at: '2026-01-01',
    },
    performance: {
      has_sufficient_data: true,
      carbon_change_pct: 8.4,
      biodiversity_change_pct: 5.1,
      vegetation_change_pct: 3.2,
      tree_cover_change_pct: 2.0,
    },
    historical: [
      {
        id: 'm1',
        site_id: TEST_SITE.id,
        recorded_at: '2022-01-01',
        carbon_tco2e: 120.5,
        biodiversity_score: 62,
        vegetation_index: 0.54,
        tree_cover_percentage: 48,
        created_at: '2022-01-01T00:00:00Z',
        updated_at: '2022-01-01T00:00:00Z',
      },
      {
        id: 'm2',
        site_id: TEST_SITE.id,
        recorded_at: '2026-01-01',
        carbon_tco2e: 205.4,
        biodiversity_score: 74.2,
        vegetation_index: 0.68,
        tree_cover_percentage: 61,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ],
    ...overrides,
  };
}

// `vi.mock` factories are hoisted above all other module-level code, so
// the mock functions they close over must be created via `vi.hoisted`
// rather than plain top-level `const` (which would otherwise be
// referenced before initialization).
const {
  mockGetSiteById,
  mockFetchSiteById,
  mockDeleteSite,
  mockFetchSites,
  mockGetProjectById,
  mockFetchProjectById,
  mockFetchProjects,
  mockGetSiteAnalytics,
} = vi.hoisted(() => ({
  mockGetSiteById: vi.fn(),
  mockFetchSiteById: vi.fn(),
  mockDeleteSite: vi.fn(),
  mockFetchSites: vi.fn(),
  mockGetProjectById: vi.fn(),
  mockFetchProjectById: vi.fn(),
  mockFetchProjects: vi.fn(),
  mockGetSiteAnalytics: vi.fn(),
}));

vi.mock('../../store/siteStore', () => ({
  useSiteStore: (
    selector?: (state: {
      getSiteById: typeof mockGetSiteById;
      fetchSiteById: typeof mockFetchSiteById;
      deleteSite: typeof mockDeleteSite;
      fetchSites: typeof mockFetchSites;
      sites: never[];
    }) => unknown,
  ) => {
    const state = {
      getSiteById: mockGetSiteById,
      fetchSiteById: mockFetchSiteById,
      deleteSite: mockDeleteSite,
      fetchSites: mockFetchSites,
      sites: [],
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../store/projectStore', () => ({
  useProjectStore: (
    selector?: (state: {
      getProjectById: typeof mockGetProjectById;
      fetchProjectById: typeof mockFetchProjectById;
      fetchProjects: typeof mockFetchProjects;
      projects: never[];
    }) => unknown,
  ) => {
    const state = {
      getProjectById: mockGetProjectById,
      fetchProjectById: mockFetchProjectById,
      fetchProjects: mockFetchProjects,
      projects: [],
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../services/analyticsService', () => ({
  analyticsService: {
    getSiteAnalytics: mockGetSiteAnalytics,
    createMetric: vi.fn(),
    updateMetric: vi.fn(),
    deleteMetric: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/sites/site-1']}>
      <Routes>
        <Route path="/sites/:siteId" element={<SiteAnalyticsPage />} />
        {/* Present so post-delete navigation to the project resolves to
         * something instead of falling through to no match (stderr
         * noise); its content isn't asserted on here. */}
        <Route path="/projects/:projectId" element={<div>Project page</div>} />
        <Route path="/sites" element={<div>Sites page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SiteAnalyticsPage', () => {
  beforeEach(() => {
    mockGetSiteById.mockReset().mockReturnValue(TEST_SITE);
    mockFetchSiteById.mockReset().mockResolvedValue(TEST_SITE);
    mockDeleteSite.mockReset().mockResolvedValue(undefined);
    mockFetchSites.mockReset().mockResolvedValue(undefined);
    mockGetProjectById.mockReset().mockReturnValue(TEST_PROJECT);
    mockFetchProjectById.mockReset().mockResolvedValue(TEST_PROJECT);
    mockFetchProjects.mockReset().mockResolvedValue(undefined);
    mockGetSiteAnalytics.mockReset();
    addSiteFlowPropsSpy.mockReset();
    carbonChartPropsSpy.mockReset();
  });

  it('renders site details (name, project, area, perimeter, centroid) once loaded', async () => {
    mockGetSiteAnalytics.mockResolvedValue(makeAnalytics());
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Test Site A', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Test Project').length).toBeGreaterThan(0);
    expect(screen.getByText('12.43 ha')).toBeInTheDocument();
    expect(screen.getByText('1.872 km')).toBeInTheDocument();
  });

  it('shows a loading state before analytics resolve', async () => {
    let resolveAnalytics: (value: SiteAnalyticsResponse) => void = () => {};
    mockGetSiteAnalytics.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalytics = resolve;
        }),
    );
    renderPage();

    await screen.findByRole('heading', { name: 'Test Site A', level: 2 });
    // Charts/KPI values haven't rendered yet while analytics is in flight.
    expect(screen.queryByText(/Historical Environmental Performance/i)).toBeInTheDocument();
    expect(screen.queryByText(/205.4/)).not.toBeInTheDocument();

    resolveAnalytics(makeAnalytics());
    await waitFor(() => expect(screen.getByText(/205.4/)).toBeInTheDocument());
  });

  it('shows an error state with retry when analytics fails to load', async () => {
    mockGetSiteAnalytics.mockRejectedValueOnce(new Error('network down'));
    const user = userEvent.setup();
    renderPage();

    expect(
      (await screen.findAllByText(/Unable to load environmental analytics/i)).length,
    ).toBeGreaterThan(0);

    mockGetSiteAnalytics.mockResolvedValueOnce(makeAnalytics());
    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => expect(screen.getByText(/205.4/)).toBeInTheDocument());
  });

  it('shows an empty state when the site has no metrics yet', async () => {
    mockGetSiteAnalytics.mockResolvedValue(makeAnalytics({ historical: [] }));
    renderPage();

    expect(
      await screen.findByText(/Environmental analytics are not available yet/i),
    ).toBeInTheDocument();
  });

  it('filters chart/table data by the selected time range', async () => {
    mockGetSiteAnalytics.mockResolvedValue(makeAnalytics());
    const user = userEvent.setup();
    renderPage();

    await screen.findByTestId('carbon-chart-stub');
    // Default range ('5y') keeps both 2022 and 2026 measurements.
    expect(carbonChartPropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.anything(), expect.anything()]),
      }),
    );
    expect(carbonChartPropsSpy.mock.calls.at(-1)?.[0].data).toHaveLength(2);

    // "1 Year" relative to the latest record (2026-01-01) excludes the
    // 2022-01-01 measurement from the chart data the filter actually
    // controls (the Measurement Records table intentionally always
    // shows the complete history regardless of the chart time filter).
    const select = screen.getByLabelText(/time range/i);
    await user.selectOptions(select, '1y');

    await waitFor(() => {
      expect(carbonChartPropsSpy.mock.calls.at(-1)?.[0].data).toHaveLength(1);
    });
    expect(carbonChartPropsSpy.mock.calls.at(-1)?.[0].data[0].label).toBe('2026-01-01');

    // The full history is still visible in the records table regardless.
    expect(screen.getByText('2022-01-01')).toBeInTheDocument();
  });

  it('opens the edit flow with the current site when "Edit Site" is clicked', async () => {
    mockGetSiteAnalytics.mockResolvedValue(makeAnalytics());
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('heading', { name: 'Test Site A', level: 2 });
    await user.click(screen.getByRole('button', { name: /edit site/i }));

    expect(screen.getByTestId('edit-site-flow-stub')).toBeInTheDocument();
    expect(addSiteFlowPropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: true, site: TEST_SITE }),
    );
  });

  it('deletes the site and navigates to its project on confirm', async () => {
    mockGetSiteAnalytics.mockResolvedValue(makeAnalytics());
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('heading', { name: 'Test Site A', level: 2 });
    await user.click(screen.getByRole('button', { name: /delete site/i }));
    // ConfirmDialog renders a second, distinct "Delete" confirm button.
    const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockDeleteSite).toHaveBeenCalledWith('site-1'));
  });
});
