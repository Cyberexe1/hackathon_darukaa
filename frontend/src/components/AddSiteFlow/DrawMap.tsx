import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { bbox as turfBbox, centroid as turfCentroid } from '@turf/turf';
import type { Feature, Polygon } from 'geojson';
import { ErrorState } from '../ErrorState/ErrorState';
import { MapSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { MAPBOX_STYLE_LIGHT } from '../MapView/mapStyle';
import { parseImportedPolygonGeoJSON } from './geometryUtils';

// `VITE_MAPBOX_ACCESS_TOKEN` is the canonical name (matches the hackathon
// spec/deployment docs); `VITE_MAPBOX_TOKEN` is accepted as a
// backward-compatible alias for existing local .env files. This is a
// PUBLIC Mapbox token, safe to bundle into the browser build — it is
// never sent to or stored by the backend.
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ??
  import.meta.env.VITE_MAPBOX_TOKEN) as string | undefined;

interface DrawMapProps {
  onPolygonChange: (feature: Feature<Polygon> | null) => void;
  className?: string;
  /** Pre-loads an existing polygon onto the map on mount — used by the
   * Edit Site flow so the user starts from the site's current boundary
   * instead of a blank map. Only read once per mount; changing it after
   * the map has loaded has no effect (there is intentionally no "reset
   * to original" — Cancel in the parent flow simply discards the whole
   * in-progress edit instead). */
  initialFeature?: Feature<Polygon> | null;
}

/**
 * Mapbox GL Draw powered polygon drawing surface for the Add Site flow.
 * Offers two ways to define the boundary:
 *  - "Draw Points": explicit point-by-point placement — each click adds a
 *    vertex connected to the previous one (1st→2nd, 2nd→3rd, …), and
 *    double-clicking (or clicking the first vertex again) closes the ring
 *    back to the first point, same as native Mapbox GL Draw polygon mode.
 *  - "Import Polygon": paste or upload a GeoJSON Polygon/Feature/
 *    FeatureCollection directly instead of drawing by hand.
 * Only ever keeps a single polygon at a time — starting either flow again
 * replaces the previous boundary. Emits the current polygon feature (or
 * null) on every create/update/delete/import so the parent step can
 * compute geometry stats.
 */
export function DrawMap({ onPolygonChange, className = '', initialFeature = null }: DrawMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [runtimeError, setRuntimeError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [drawMode, setDrawMode] = useState<string>('simple_select');
  const [importPanelOpen, setImportPanelOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  // Missing token is a static config problem, not runtime state — compute
  // it directly each render instead of syncing it into state via an effect.
  const loadError = !MAPBOX_TOKEN || runtimeError;

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    const container = containerRef.current;
    if (!container) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialCenter: [number, number] = initialFeature
      ? (turfCentroid(initialFeature).geometry.coordinates as [number, number])
      : [78.9, 20.5];

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container,
        style: MAPBOX_STYLE_LIGHT,
        center: initialCenter,
        zoom: initialFeature ? 13 : 4,
      });
    } catch {
      // Synchronous failure constructing the external Mapbox GL instance
      // itself (e.g. invalid style/container) — genuinely part of bridging
      // to that external system, not a derived-state anti-pattern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRuntimeError(true);
      return;
    }

    map.on('error', () => setRuntimeError(true));
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      // The native polygon control is intentionally disabled — drawing is
      // started explicitly via the "Draw Points" button below instead, so
      // the map doesn't jump straight into draw mode on load and the user
      // can choose "Import Polygon" first without an accidental vertex.
      controls: { polygon: false, trash: true },
      defaultMode: 'simple_select',
      styles: [
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: { 'fill-color': '#10b981', 'fill-opacity': 0.25 },
        },
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: { 'line-color': '#12372a', 'line-width': 2.5, 'line-dasharray': [2, 1] },
        },
        {
          id: 'gl-draw-polygon-vertex',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#12372a',
            'circle-stroke-width': 2,
          },
        },
      ],
    });

    map.addControl(draw);
    drawRef.current = draw;

    // Tracks the deferred "switch to direct_select" timeouts scheduled by
    // `enforceSinglePolygon` below, so they can be cancelled on unmount
    // (avoids calling into a Draw/map instance that's already been torn
    // down if the component unmounts in the brief window before the
    // timeout fires).
    const pendingSelectTimeouts: ReturnType<typeof setTimeout>[] = [];

    const emitPolygon = () => {
      const data = draw.getAll();
      const polygonFeature = data.features.find((f) => f.geometry.type === 'Polygon') as
        | Feature<Polygon>
        | undefined;
      onPolygonChange(polygonFeature ?? null);
    };

    // Only keep the most recently drawn polygon — remove older ones.
    const enforceSinglePolygon = () => {
      const data = draw.getAll();
      const polygons = data.features.filter((f) => f.geometry.type === 'Polygon');
      if (polygons.length > 1) {
        for (let i = 0; i < polygons.length - 1; i++) {
          const id = polygons[i].id;
          if (id !== undefined) draw.delete(String(id));
        }
      }
      emitPolygon();

      // Drop straight into vertex-editing mode for the polygon that was
      // just finished, so points are immediately draggable — the user
      // shouldn't have to click the polygon again just to start
      // adjusting it.
      //
      // Deferred to the next tick deliberately: `draw.create` can fire
      // *synchronously from inside* Mapbox GL Draw's own `changeMode()`
      // call (this happens both when finishing via the "Finish" button
      // and when clicking back onto the first vertex — both call
      // `changeMode('simple_select', ...)`, whose internal
      // `DrawPolygon.onStop` fires `draw.create` mid-transition).
      // Calling `draw.changeMode()` again synchronously from within that
      // same call stack re-enters Draw's non-reentrant mode state
      // machine: it re-runs `onStop` a second time on the same polygon,
      // silently removing an extra vertex — for a minimal 3-vertex
      // polygon this drops it below the valid minimum and Draw quietly
      // deletes the whole feature, which is exactly why "Finish"
      // appeared to do nothing. Deferring with a macrotask lets the
      // in-flight `changeMode` call return first.
      const timeoutId = setTimeout(() => {
        const finished = draw.getAll().features.find((f) => f.geometry.type === 'Polygon');
        const finishedId = finished?.id;
        if (finishedId !== undefined) {
          draw.changeMode('direct_select', { featureId: String(finishedId) });
          setDrawMode('direct_select');
        }
      }, 0);
      pendingSelectTimeouts.push(timeoutId);
    };

    map.on('draw.create', enforceSinglePolygon);
    map.on('draw.update', emitPolygon);
    map.on('draw.delete', emitPolygon);
    map.on('draw.modechange', (e: unknown) => {
      const mode = (e as { mode?: string })?.mode;
      if (mode) setDrawMode(mode);
    });

    map.on('load', () => {
      if (initialFeature) {
        draw.add(initialFeature);
        emitPolygon();
      }
      setIsLoaded(true);
    });

    mapRef.current = map;

    return () => {
      pendingSelectTimeouts.forEach(clearTimeout);
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
      setIsLoaded(false);
    };
    // `initialFeature` deliberately excluded — it's a "load once on
    // mount" prop, not something the map should react to on every
    // subsequent parent re-render (which would be indistinguishable from
    // the user's own edits being reverted).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  const startDrawPoints = () => {
    const draw = drawRef.current;
    if (!draw) return;
    setImportPanelOpen(false);
    setImportError(null);
    // Only one polygon at a time — starting a fresh point-by-point
    // boundary replaces whatever was there (drawn or imported) before.
    draw.deleteAll();
    onPolygonChange(null);
    draw.changeMode('draw_polygon');
    setDrawMode('draw_polygon');
  };

  // Finishes the in-progress polygon without requiring a double-click or
  // a precise click back onto the first vertex. Mapbox GL Draw's
  // `draw_polygon` mode finalizes (fires `draw.create`) on *any* mode
  // change as long as at least 3 vertices have been placed — so simply
  // leaving draw mode here is enough. `enforceSinglePolygon` (wired to
  // `draw.create`) then automatically drops the finished shape into
  // `direct_select` so its vertices are immediately draggable.
  const finishDrawing = () => {
    const draw = drawRef.current;
    if (!draw) return;
    draw.changeMode('simple_select');
  };

  const openImportPanel = () => {
    const draw = drawRef.current;
    draw?.changeMode('simple_select');
    setImportError(null);
    setImportPanelOpen(true);
  };

  const cancelImportPanel = () => {
    setImportPanelOpen(false);
    setImportError(null);
    setImportText('');
  };

  const applyImportedPolygon = (raw: string) => {
    const draw = drawRef.current;
    const map = mapRef.current;
    if (!draw) return;
    try {
      const feature = parseImportedPolygonGeoJSON(raw);
      draw.deleteAll();
      const ids = draw.add(feature);
      draw.changeMode('simple_select', { featureIds: ids });
      setDrawMode('simple_select');
      onPolygonChange(feature);
      setImportPanelOpen(false);
      setImportText('');
      setImportError(null);
      if (map) {
        const [minX, minY, maxX, maxY] = turfBbox(feature);
        map.fitBounds([minX, minY, maxX, maxY], { padding: 48, duration: 500, maxZoom: 17 });
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not import that polygon.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setImportText(text);
      applyImportedPolygon(text);
    };
    reader.onerror = () => setImportError('Could not read that file.');
    reader.readAsText(file);
  };

  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-container-high rounded-2xl ${className}`}
      >
        <ErrorState
          title="Map could not be loaded."
          description="Check your Mapbox configuration and retry."
          onRetry={() => {
            setRuntimeError(false);
            setRetryKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0">
          <MapSkeleton />
        </div>
      )}
      {isLoaded && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-space-sm max-w-[280px]">
          <div className="flex gap-space-sm">
            <button
              type="button"
              onClick={openImportPanel}
              aria-pressed={importPanelOpen}
              className={`inline-flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg font-label-technical text-label-micro shadow-md backdrop-blur-md border border-outline-variant/40 transition-colors ${
                importPanelOpen
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container-lowest/95 text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                upload_file
              </span>
              Import Polygon
            </button>
            <button
              type="button"
              onClick={startDrawPoints}
              aria-pressed={drawMode === 'draw_polygon'}
              className={`inline-flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg font-label-technical text-label-micro shadow-md backdrop-blur-md border border-outline-variant/40 transition-colors ${
                drawMode === 'draw_polygon'
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container-lowest/95 text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                edit_location_alt
              </span>
              Draw Points
            </button>
            {drawMode === 'draw_polygon' && (
              <button
                type="button"
                onClick={finishDrawing}
                className="inline-flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg font-label-technical text-label-micro shadow-md backdrop-blur-md border border-outline-variant/40 transition-colors bg-primary text-on-primary hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  check
                </span>
                Finish
              </button>
            )}
          </div>

          {importPanelOpen ? (
            <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-md p-space-sm flex flex-col gap-space-xs">
              <p className="font-label-technical text-label-micro text-on-surface-variant">
                Paste GeoJSON (Polygon, Feature, or FeatureCollection) or upload a file.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={4}
                placeholder='{"type":"Polygon","coordinates":[[[...]]]}'
                className="w-full rounded-md border border-outline-variant px-space-xs py-1 font-mono text-[11px] text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-surface-tint resize-none"
              />
              {importError && (
                <p className="font-body-sm text-label-micro text-error">{importError}</p>
              )}
              <div className="flex items-center justify-between gap-space-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-label-technical text-label-micro text-surface-tint hover:underline"
                >
                  Choose file…
                </button>
                <div className="flex gap-space-xs">
                  <button
                    type="button"
                    onClick={cancelImportPanel}
                    className="px-space-sm py-1 rounded-md font-label-technical text-label-micro text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => applyImportedPolygon(importText)}
                    disabled={!importText.trim()}
                    className="px-space-sm py-1 rounded-md font-label-technical text-label-micro bg-primary-container text-on-primary hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use Polygon
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-md px-space-sm py-space-xs">
              <p className="font-label-technical text-label-micro text-on-surface-variant">
                {drawMode === 'draw_polygon'
                  ? 'Click to place vertices (3+ needed). Click "Finish" when done — no need to double-click or close the ring yourself. Press Delete/Backspace to remove the last vertex, or Esc to cancel drawing.'
                  : drawMode === 'direct_select'
                    ? 'Drag any white vertex dot to reshape the boundary. Click elsewhere on the map to deselect.'
                    : 'Click "Draw Points" to place vertices on the map, or "Import Polygon" to paste/upload GeoJSON. Click a drawn polygon to drag its vertices.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
