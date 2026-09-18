import { vi } from 'vitest';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

/**
 * Minimal fake of `@mapbox/mapbox-gl-draw`'s default export, sufficient
 * to exercise DrawMap's "Draw Points" / "Import Polygon" wiring
 * (add/deleteAll/changeMode/getAll/delete) without needing a real Mapbox
 * GL canvas. Tracked on `globalThis` for the same reason as
 * `mapboxgl.ts`'s `FakeMap` — resilient to `vi.resetModules()` between
 * tests if a suite ever needs that.
 */
declare global {
  var __lastDrawInstance: FakeMapboxDraw | null;
}

let idCounter = 0;

interface FakeMapLike {
  fire: (event: string, ...args: unknown[]) => void;
}

class FakeMapboxDraw {
  private features: Map<string, Feature> = new Map();
  /** Captured from `onAdd(map)` — real Mapbox GL calls this when
   * `map.addControl(draw)` runs, exactly like the production code path
   * in DrawMap.tsx. Needed so `changeMode` can fire `draw.create` on the
   * *map* (where DrawMap actually listens via `map.on('draw.create', ...)`),
   * not on the draw instance itself. */
  private map: FakeMapLike | null = null;

  constructor() {
    globalThis.__lastDrawInstance = this;
  }

  onAdd(map: FakeMapLike) {
    this.map = map;
    return document.createElement('div');
  }

  onRemove() {
    // no-op
  }

  add(geojson: Feature | FeatureCollection | Geometry): string[] {
    const featuresToAdd: Feature[] =
      (geojson as FeatureCollection).type === 'FeatureCollection'
        ? (geojson as FeatureCollection).features
        : (geojson as Feature).type === 'Feature'
          ? [geojson as Feature]
          : [{ type: 'Feature', properties: {}, geometry: geojson as Geometry }];

    const ids: string[] = [];
    for (const feature of featuresToAdd) {
      const id = feature.id !== undefined ? String(feature.id) : `fake-${++idCounter}`;
      this.features.set(id, { ...feature, id });
      ids.push(id);
    }
    return ids;
  }

  get(featureId: string) {
    return this.features.get(featureId);
  }

  getAll(): FeatureCollection {
    return { type: 'FeatureCollection', features: Array.from(this.features.values()) };
  }

  delete(ids: string | string[]) {
    for (const id of Array.isArray(ids) ? ids : [ids]) {
      this.features.delete(id);
    }
    return this;
  }

  deleteAll() {
    this.features.clear();
    return this;
  }

  /**
   * Mirrors a real hazard in @mapbox/mapbox-gl-draw: calling
   * `changeMode('simple_select', ...)` while `draw_polygon` mode holds a
   * pending in-progress polygon (armed via `__armPendingPolygon` below)
   * synchronously fires `draw.create` on the map mid-call — via the real
   * library's `DrawPolygon.onStop` — *before* `changeMode` itself
   * returns. If the resulting `draw.create` handler calls `changeMode`
   * again reentrantly (which DrawMap's `enforceSinglePolygon` used to do
   * synchronously), the real library's non-reentrant mode state machine
   * corrupts the in-progress polygon (removes an extra vertex, which can
   * invalidate and silently delete a minimal 3-vertex ring). This fake
   * reproduces that exact "fire draw.create synchronously inside
   * changeMode, on the map object" ordering so DrawMap's reentrancy
   * guard (deferring the follow-up `changeMode` with `setTimeout`) can
   * be exercised without a real Mapbox GL canvas.
   */
  changeMode = vi.fn((mode: string) => {
    if (mode === 'simple_select' && this._pendingPolygon) {
      const feature = this._pendingPolygon;
      this._pendingPolygon = null;
      this._insideOnStop = true;
      // Real Draw removes one trailing coordinate per `onStop` call
      // before validating/creating. Simulate that here so a *reentrant*
      // `changeMode` call from within the `draw.create` handler below
      // triggers a second, unwanted removal — exactly like the real
      // library — which for a minimal ring can invalidate and delete it.
      const ring = (feature.geometry as { coordinates: number[][][] }).coordinates[0];
      ring.pop();
      if (ring.length < 4) {
        // Below the minimum valid ring length — real Draw silently
        // deletes the feature instead of firing `draw.create`.
        this._insideOnStop = false;
        return;
      }
      this.features.set(String(feature.id), feature);
      this.map?.fire('draw.create', { features: [feature] });
      this._insideOnStop = false;
    } else if (this._insideOnStop) {
      // A reentrant call while still inside the `onStop` above — this is
      // the exact hazard being simulated. Force it back into the
      // pending-polygon state so the *next* `changeMode('simple_select')`
      // call (real Draw would immediately re-run onStop synchronously)
      // performs a second, corrupting coordinate removal.
      const current = Array.from(this.features.values())[0];
      if (current) {
        this._pendingPolygon = current;
        this.features.clear();
        this.changeMode('simple_select');
      }
    }
  });
  private _pendingPolygon: Feature | null = null;
  private _insideOnStop = false;

  /** Test helper: arms a pending in-progress polygon so the next
   * `changeMode('simple_select')` call reproduces the real
   * reentrancy-hazard ordering documented above — equivalent to the user
   * having drawn a polygon in `draw_polygon` mode and then finishing it. */
  __armPendingPolygon(feature: Feature) {
    this._pendingPolygon = feature;
  }

  getMode = vi.fn(() => 'simple_select');
  trash = vi.fn();
}

export function getLastDrawInstance(): FakeMapboxDraw | null {
  return globalThis.__lastDrawInstance ?? null;
}

export function resetLastDrawInstance() {
  globalThis.__lastDrawInstance = null;
}

export default FakeMapboxDraw;
