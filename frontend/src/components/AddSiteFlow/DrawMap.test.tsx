import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// `mapbox-gl` requires a real WebGL context, unavailable in jsdom.
vi.mock('mapbox-gl', async () => {
  const mod = await import('../../test/mocks/mapboxgl');
  return { default: mod.default };
});

// `@mapbox/mapbox-gl-draw` is mocked with a fake that supports the
// add/deleteAll/changeMode/getAll subset DrawMap actually calls — this
// lets the "Import Polygon" and "Draw Points" buttons be exercised
// without a real Mapbox GL Draw canvas/mouse interaction.
vi.mock('@mapbox/mapbox-gl-draw', async () => {
  const mod = await import('../../test/mocks/mapboxglDraw');
  return { default: mod.default };
});

const VALID_POLYGON_GEOJSON = JSON.stringify({
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
});

describe('DrawMap', () => {
  beforeEach(() => {
    // `DrawMap`'s module-level `MAPBOX_TOKEN` constant is only computed
    // once per module instance — reset modules so each test's
    // `vi.stubEnv` call is actually observed on (re-)import, same
    // pattern as MapView.test.tsx.
    vi.resetModules();
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'pk.test-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function renderLoaded(onPolygonChange = vi.fn()) {
    const { DrawMap } = await import('./DrawMap');
    const mapboxglMock = await import('../../test/mocks/mapboxgl');
    mapboxglMock.resetLastMapInstance();

    render(<DrawMap onPolygonChange={onPolygonChange} />);

    await waitFor(() => {
      expect(mapboxglMock.getLastMapInstance()).not.toBeNull();
    });
    mapboxglMock.getLastMapInstance()!.fire('load');

    await screen.findByRole('button', { name: /import polygon/i });
    return { onPolygonChange };
  }

  it('shows the friendly config error when no Mapbox token is set', async () => {
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', '');
    vi.stubEnv('VITE_MAPBOX_TOKEN', '');
    const { DrawMap } = await import('./DrawMap');

    render(<DrawMap onPolygonChange={vi.fn()} />);

    expect(await screen.findByText(/Map could not be loaded/i)).toBeInTheDocument();
  });

  it('renders "Import Polygon" and "Draw Points" buttons once the map loads', async () => {
    await renderLoaded();

    expect(screen.getByRole('button', { name: /import polygon/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /draw points/i })).toBeInTheDocument();
  });

  it('starts point-by-point drawing mode via the Draw Points button', async () => {
    await renderLoaded();
    const drawMock = await import('../../test/mocks/mapboxglDraw');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /draw points/i }));

    const draw = drawMock.getLastDrawInstance()!;
    expect(draw.changeMode).toHaveBeenCalledWith('draw_polygon');
    expect(screen.getByRole('button', { name: /draw points/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('imports a pasted GeoJSON polygon and reports it via onPolygonChange', async () => {
    const { onPolygonChange } = await renderLoaded();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /import polygon/i }));

    // Pasting raw GeoJSON via `fireEvent.change` — `user.type` interprets
    // `{`/`}` as special key syntax (e.g. `{enter}`), unsuitable for
    // typing literal JSON braces.
    const textarea = await screen.findByPlaceholderText(/"type":"Polygon"/i);
    fireEvent.change(textarea, { target: { value: VALID_POLYGON_GEOJSON } });
    await user.click(screen.getByRole('button', { name: /use polygon/i }));

    await waitFor(() => {
      expect(onPolygonChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Feature',
          geometry: expect.objectContaining({ type: 'Polygon' }),
        }),
      );
    });
    // Import panel closes on success.
    expect(screen.queryByRole('button', { name: /use polygon/i })).not.toBeInTheDocument();
  });

  it('shows an inline error and does not call onPolygonChange for invalid GeoJSON', async () => {
    const { onPolygonChange } = await renderLoaded();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /import polygon/i }));
    const textarea = await screen.findByPlaceholderText(/"type":"Polygon"/i);
    fireEvent.change(textarea, { target: { value: '{ not valid json' } });
    await user.click(screen.getByRole('button', { name: /use polygon/i }));

    // The textarea itself contains the literal text "not valid json" (the
    // pasted input), so match the error message exactly via its leading
    // capital "That" to avoid ambiguity with `findByText`.
    expect(await screen.findByText('That is not valid JSON.')).toBeInTheDocument();
    expect(onPolygonChange).not.toHaveBeenCalled();
  });
});
