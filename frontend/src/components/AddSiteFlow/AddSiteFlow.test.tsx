import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Feature, Polygon } from 'geojson';
import { AddSiteFlow } from './AddSiteFlow';

const mockAddSite = vi.fn();
const mockFetchProjects = vi.fn();

vi.mock('../../store/siteStore', () => ({
  useSiteStore: (selector: (state: { addSite: typeof mockAddSite }) => unknown) =>
    selector({ addSite: mockAddSite }),
}));

vi.mock('../../store/projectStore', () => ({
  useProjectStore: () => ({
    projects: [
      {
        id: 'proj-1',
        name: 'Western Ghats Restoration',
        description: '',
        project_type: 'Forest Restoration',
        status: 'Active',
        country: 'India',
        region: 'Maharashtra',
        start_date: '2024-01-01',
        end_date: null,
        site_count: 0,
        total_area_hectares: 0,
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    fetchProjects: mockFetchProjects,
  }),
}));

// DrawMap wraps @mapbox/mapbox-gl-draw directly — mocked out entirely so
// tests can drive `onPolygonChange` deterministically instead of
// simulating real mouse-driven polygon drawing on a canvas.
let latestOnPolygonChange: ((feature: Feature<Polygon> | null) => void) | null = null;
vi.mock('./DrawMap', () => ({
  DrawMap: ({ onPolygonChange }: { onPolygonChange: (f: Feature<Polygon> | null) => void }) => {
    latestOnPolygonChange = onPolygonChange;
    return <div data-testid="draw-map-stub" />;
  },
}));

const VALID_POLYGON_FEATURE: Feature<Polygon> = {
  type: 'Feature',
  properties: {},
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
};

async function advanceThroughToDrawStep(user: ReturnType<typeof userEvent.setup>) {
  // Step 1: select project.
  const projectSelect = screen.getByLabelText(/select the project/i);
  await user.selectOptions(projectSelect, 'proj-1');
  await user.click(screen.getByRole('button', { name: /next/i }));

  // Step 2: site name. `getByLabelText(/site name/i)` would also match
  // the step-progress text "Step 2 of 5 · Site Name" — target the input
  // by its exact id instead.
  await user.type(document.getElementById('add-site-name')!, 'Test Site A');
  await user.click(screen.getByRole('button', { name: /next/i }));
}

describe('AddSiteFlow', () => {
  beforeEach(() => {
    mockAddSite.mockReset();
    mockFetchProjects.mockReset();
    latestOnPolygonChange = null;
  });

  it('disables the Next button on the draw step until a polygon exists', async () => {
    const user = userEvent.setup();
    render(<AddSiteFlow isOpen onClose={vi.fn()} />);

    await advanceThroughToDrawStep(user);

    // Now on step 3 (Draw Boundary) — Next should be disabled with no polygon.
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(screen.getByTestId('draw-map-stub')).toBeInTheDocument();
  });

  it('enables Next once a valid polygon is drawn, and reaches the Save Site button', async () => {
    const user = userEvent.setup();
    render(<AddSiteFlow isOpen onClose={vi.fn()} />);

    await advanceThroughToDrawStep(user);

    // Simulate DrawMap reporting a completed polygon.
    latestOnPolygonChange?.(VALID_POLYGON_FEATURE);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
    });

    // Step 3 -> 4 (Review Geometry).
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Area/i)).toBeInTheDocument();

    // Step 4 -> 5 (Save Site).
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('button', { name: /save site/i })).toBeInTheDocument();
  });

  it('calls siteStore.addSite with the drawn GeoJSON when Save Site is clicked', async () => {
    mockAddSite.mockResolvedValue({
      id: 'site-new',
      project_id: 'proj-1',
      name: 'Test Site A',
      description: '',
      area_hectares: 10,
      perimeter_km: 1.2,
      centroid: { lat: 19.1, lon: 72.8 },
      geometry: VALID_POLYGON_FEATURE.geometry,
      status: 'In Review',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });

    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<AddSiteFlow isOpen onClose={vi.fn()} onCreated={onCreated} />);

    await advanceThroughToDrawStep(user);
    latestOnPolygonChange?.(VALID_POLYGON_FEATURE);
    await waitFor(() => expect(screen.getByRole('button', { name: /next/i })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: /next/i })); // -> review
    await user.click(screen.getByRole('button', { name: /next/i })); // -> save

    await user.click(screen.getByRole('button', { name: /save site/i }));

    await waitFor(() => {
      expect(mockAddSite).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'proj-1',
          name: 'Test Site A',
          geometry: VALID_POLYGON_FEATURE.geometry,
          status: 'In Review',
        }),
      );
    });

    // Never sends area/perimeter/centroid — the backend computes those
    // authoritatively from the geometry.
    const call = mockAddSite.mock.calls[0][0];
    expect(call).not.toHaveProperty('area_hectares');
    expect(call).not.toHaveProperty('perimeter_km');
    expect(call).not.toHaveProperty('centroid');

    await waitFor(() => {
      expect(screen.getByText(/Site saved successfully/i)).toBeInTheDocument();
    });
    expect(onCreated).toHaveBeenCalled();
  });

  it('shows an error message and keeps the modal open when saving fails', async () => {
    mockAddSite.mockRejectedValue(new Error('network down'));

    const user = userEvent.setup();
    render(<AddSiteFlow isOpen onClose={vi.fn()} />);

    await advanceThroughToDrawStep(user);
    latestOnPolygonChange?.(VALID_POLYGON_FEATURE);
    await waitFor(() => expect(screen.getByRole('button', { name: /next/i })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: /save site/i }));

    await waitFor(() => {
      expect(screen.getByText(/Unable to save the site boundary/i)).toBeInTheDocument();
    });
  });
});
