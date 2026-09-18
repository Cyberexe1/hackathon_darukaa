import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SiteDetailsPanel } from './SiteDetailsPanel';
import type { Site } from '../../types/dashboard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const { mockGetProjectById, mockGetSiteAnalytics } = vi.hoisted(() => ({
  mockGetProjectById: vi.fn(),
  mockGetSiteAnalytics: vi.fn(),
}));

vi.mock('../../store/projectStore', () => ({
  useProjectStore: (selector: (state: { getProjectById: typeof mockGetProjectById }) => unknown) =>
    selector({ getProjectById: mockGetProjectById }),
}));

vi.mock('../../services/analyticsService', () => ({
  analyticsService: { getSiteAnalytics: mockGetSiteAnalytics },
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

function renderPanel(props: Partial<React.ComponentProps<typeof SiteDetailsPanel>> = {}) {
  const onClose = vi.fn();
  const result = render(
    <MemoryRouter>
      <SiteDetailsPanel site={TEST_SITE} onClose={onClose} {...props} />
    </MemoryRouter>,
  );
  return { onClose, ...result };
}

describe('SiteDetailsPanel', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGetProjectById.mockReset().mockReturnValue({ id: 'proj-1', name: 'Test Project' });
    mockGetSiteAnalytics.mockReset().mockResolvedValue({
      summary: {
        carbon_total: 205.4,
        biodiversity_current: 74.2,
        vegetation_current: 0.68,
        tree_cover_current: 61,
        first_recorded_at: '2022-01-01',
        last_recorded_at: '2026-01-01',
      },
    });
  });

  it('renders nothing when there is no site and it is not loading', () => {
    render(
      <MemoryRouter>
        <SiteDetailsPanel site={null} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders site name, project name, area, perimeter, and centroid', async () => {
    renderPanel();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Site A')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('12.43 ha')).toBeInTheDocument();
    expect(screen.getByText('1.872 km')).toBeInTheDocument();
    expect(screen.getByText(/19.1100, 72.8100/)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetSiteAnalytics).toHaveBeenCalledWith('site-1');
    });
  });

  it('navigates to the site analytics route when "View Site Analytics" is clicked', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: /view site analytics/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/sites/site-1');
  });

  it('navigates to the sites list when "View All Sites" is clicked', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: /view all sites/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/sites');
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    await user.click(screen.getByRole('button', { name: /close panel/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    // The backdrop is the first `aria-hidden` overlay div — clicking
    // anywhere on it (outside the panel itself) should dismiss it.
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows the loading skeleton when isLoading is true and there is no site yet', () => {
    render(
      <MemoryRouter>
        <SiteDetailsPanel site={null} isLoading onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Test Site A')).not.toBeInTheDocument();
  });

  it('falls back to "No monitoring data" when the analytics fetch fails', async () => {
    mockGetSiteAnalytics.mockReset().mockRejectedValue(new Error('network down'));
    renderPanel();

    await waitFor(() => {
      expect(screen.getAllByText(/No monitoring data/i).length).toBeGreaterThan(0);
    });
  });
});
