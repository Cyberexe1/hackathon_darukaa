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

class FakeMapboxDraw {
  private features: Map<string, Feature> = new Map();

  constructor() {
    globalThis.__lastDrawInstance = this;
  }

  onAdd() {
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

  changeMode = vi.fn();
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
