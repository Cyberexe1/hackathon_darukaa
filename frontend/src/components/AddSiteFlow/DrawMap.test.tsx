import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// `mapbox-gl` requires a real WebGL context, unavailable in jsdom.
vi.mock('mapbox-gl', async () => {
  const mod = await import('../../test/mocks/mapboxgl');
  return { default: mod.default };
});

// `@mapbox/mapbox-gl-draw` is mocked with a fake that supports the
// add/deleteAll/changeMode/getAll subset DrawMap actually calls — this
// lets the "Draw Points" button be exercised without a real Mapbox GL
// Draw canvas/mouse interaction.
vi.mock('@mapbox/mapbox-gl-draw', async () => {
  const mod = await import('../../test/mocks/mapboxglDraw');
  return { default: mod.default };
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

    await screen.findByRole('button', { name: /draw points/i });
    return { onPolygonChange };
  }

  it('shows the friendly config error when no Mapbox token is set', async () => {
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', '');
    vi.stubEnv('VITE_MAPBOX_TOKEN', '');
    const { DrawMap } = await import('./DrawMap');

    render(<DrawMap onPolygonChange={vi.fn()} />);

    expect(await screen.findByText(/Map could not be loaded/i)).toBeInTheDocument();
  });

  it('renders the "Draw Points" button once the map loads', async () => {
    await renderLoaded();

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

  it('clicking Finish on a minimal 3-vertex polygon does not silently delete it', async () => {
    // Regression test for a reentrancy bug: @mapbox/mapbox-gl-draw fires
    // `draw.create` *synchronously from inside* `changeMode('simple_select')`
    // (via its own `DrawPolygon.onStop`). DrawMap's `draw.create` handler
    // used to call `draw.changeMode('direct_select', ...)` again
    // immediately, re-entering Draw's non-reentrant mode state machine
    // mid-transition — which silently strips a vertex and, for a minimal
    // 3-vertex ring, invalidates and deletes the whole polygon. Clicking
    // "Finish" therefore appeared to do nothing. The fix defers that
    // follow-up `changeMode` call with `setTimeout`.
    const { onPolygonChange } = await renderLoaded();
    const drawMock = await import('../../test/mocks/mapboxglDraw');
    const draw = drawMock.getLastDrawInstance()!;

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /draw points/i }));

    // Real Mapbox GL Draw keeps one extra "currently tracked" vertex
    // while drawing (updated on every mousemove) that `onStop` removes
    // before validating. A finished minimal triangle therefore has 5
    // ring positions in-progress: popping once yields the correct closed
    // 4-point triangle (v0, v1, v2, v0); popping twice (the reentrancy
    // bug) drops it to 3 — below the valid minimum — and the real
    // library silently deletes it.
    const minimalTriangleInProgress: import('geojson').Feature<import('geojson').Polygon> = {
      type: 'Feature',
      id: 'triangle-1',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [72.8, 19.1],
            [72.81, 19.1],
            [72.805, 19.11],
            [72.8, 19.1],
            [72.8, 19.1],
          ],
        ],
      },
    };
    draw.__armPendingPolygon(minimalTriangleInProgress);

    await user.click(screen.getByRole('button', { name: /finish/i }));

    // The polygon must have actually been reported, not silently dropped.
    await waitFor(() => {
      expect(onPolygonChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: 'triangle-1' }),
      );
    });
    expect(draw.getAll().features).toHaveLength(1);
  });
});
