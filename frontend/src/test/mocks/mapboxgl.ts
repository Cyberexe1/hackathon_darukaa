import { vi } from 'vitest';

/**
 * Minimal fake Mapbox GL JS `Map` instance sufficient to exercise
 * MapView/DrawMap's init/cleanup logic and event wiring without a real
 * WebGL context (unavailable in jsdom). Each test that needs finer
 * control over event firing can grab the instance via
 * `getLastMapInstance()`.
 *
 * Tracked on `globalThis` rather than a module-level variable: the
 * MapView test suite calls `vi.resetModules()` between tests (needed so
 * MapView's module-level `MAPBOX_TOKEN` constant re-reads
 * `import.meta.env` after `vi.stubEnv`), which would otherwise give the
 * `vi.mock('mapbox-gl', ...)` factory and the test file two separate
 * instances of this helper module — a plain module-level variable
 * wouldn't be shared between them. `globalThis` survives module resets.
 */
declare global {
  var __lastMapInstance: FakeMap | null;
}

class FakeMap {
  private handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  removed = false;

  constructor() {
    globalThis.__lastMapInstance = this;
  }

  on(event: string, handlerOrLayer: unknown, maybeHandler?: unknown) {
    // mapboxgl supports both `.on('load', fn)` and `.on('click', 'layer-id', fn)`.
    const handler = (typeof maybeHandler === 'function' ? maybeHandler : handlerOrLayer) as (
      ...args: unknown[]
    ) => void;
    this.handlers[event] = this.handlers[event] ?? [];
    this.handlers[event].push(handler);
    return this;
  }

  once(event: string, handler: (...args: unknown[]) => void) {
    this.on(event, handler);
    return this;
  }

  off() {
    return this;
  }

  fire(event: string, ...args: unknown[]) {
    (this.handlers[event] ?? []).forEach((h) => h(...args));
  }

  addControl(control?: { onAdd?: (map: unknown) => unknown }) {
    // Real Mapbox GL calls `control.onAdd(map)` when a control (e.g.
    // MapboxDraw) is added — some DrawMap tests need the fake draw
    // instance to have captured a reference to this map so it can fire
    // `draw.create`/etc events the same way DrawMap listens for them.
    control?.onAdd?.(this);
    return this;
  }

  addSource() {
    return this;
  }

  getSource() {
    return { setData: vi.fn() };
  }

  addLayer() {
    return this;
  }

  getLayer() {
    return true;
  }

  setLayoutProperty() {
    return this;
  }

  setPaintProperty() {
    return this;
  }

  setFeatureState() {
    return this;
  }

  setStyle() {
    return this;
  }

  getCanvas() {
    return { style: {} };
  }

  fitBounds() {
    return this;
  }

  remove() {
    this.removed = true;
  }
}

export function getLastMapInstance(): FakeMap | null {
  return globalThis.__lastMapInstance ?? null;
}

export function resetLastMapInstance() {
  globalThis.__lastMapInstance = null;
}

const mapboxgl = {
  Map: FakeMap,
  NavigationControl: vi.fn(),
  Popup: vi.fn(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    setHTML: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
  accessToken: '',
};

export default mapboxgl;
