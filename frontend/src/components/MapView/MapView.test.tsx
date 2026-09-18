import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Site } from '../../types/dashboard';

// `mapbox-gl` requires a real WebGL context, unavailable in jsdom — mock
// the whole module with a lightweight fake so MapView's init/cleanup/
// event-wiring logic can be exercised without a browser.
vi.mock('mapbox-gl', async () => {
  const mod = await import('../../test/mocks/mapboxgl');
  return { default: mod.default };
});

// `useMapStore` pulls in Zustand — fine to use the real store here since
// it's pure client state with no network calls.

const makeSite = (overrides: Partial<Site> = {}): Site => ({
  id: 'site-1',
  project_id: 'proj-1',
  name: 'Test Site',
  description: 'A test site',
  area_hectares: 12.5,
  perimeter_km: 1.4,
  centroid: { lat: 19.1, lon: 72.8 },
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
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('MapView', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the map container when a Mapbox token is configured', async () => {
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'pk.test-token');
    const { MapView } = await import('./MapView');

    render(<MapView sites={[makeSite()]} />);

    // Loading skeleton shows immediately; the map container div is
    // present in the DOM (even before the fake map fires `load`).
    expect(screen.queryByText(/Map could not be loaded/i)).not.toBeInTheDocument();
  });

  it('shows a friendly configuration message when the Mapbox token is missing', async () => {
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', '');
    vi.stubEnv('VITE_MAPBOX_TOKEN', '');
    const { MapView } = await import('./MapView');

    render(<MapView sites={[makeSite()]} />);

    expect(await screen.findByText(/Map could not be loaded/i)).toBeInTheDocument();
    expect(screen.getByText(/Check your Mapbox configuration and retry/i)).toBeInTheDocument();
  });

  it('renders sites onto the map source once the map finishes loading', async () => {
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'pk.test-token');
    const { MapView } = await import('./MapView');
    // Access `lastMapInstance` as a live property read through the module
    // namespace object each time, rather than destructuring it once — a
    // destructured `const` would capture the value (null) at import time
    // and never observe the module reassigning it once FakeMap
    // constructs, since dynamic `import()` namespace destructuring is a
    // one-time snapshot, not a live binding.
    const mapboxglMock = await import('../../test/mocks/mapboxgl');
    mapboxglMock.resetLastMapInstance();

    const site = makeSite();
    render(<MapView sites={[site]} />);

    await waitFor(() => {
      expect(mapboxglMock.getLastMapInstance()).not.toBeNull();
    });

    const mapInstance = mapboxglMock.getLastMapInstance()!;
    const addSourceSpy = vi.spyOn(mapInstance, 'addSource');
    const addLayerSpy = vi.spyOn(mapInstance, 'addLayer');

    // Simulate the Mapbox GL `load` event firing, which is when MapView
    // adds the `sites` GeoJSON source and fill/outline layers.
    mapInstance.fire('load');

    expect(addSourceSpy).toHaveBeenCalledWith(
      'sites',
      expect.objectContaining({
        type: 'geojson',
        data: expect.objectContaining({
          type: 'FeatureCollection',
          features: expect.arrayContaining([
            expect.objectContaining({ id: site.id, geometry: site.geometry }),
          ]),
        }),
      }),
    );
    expect(addLayerSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'sites-fill' }));
    expect(addLayerSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'sites-outline' }));
  });
});
