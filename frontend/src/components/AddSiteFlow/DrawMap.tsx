import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import type { Feature, Polygon } from 'geojson';
import { ErrorState } from '../ErrorState/ErrorState';
import { MapSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { MAPBOX_STYLE_LIGHT } from '../MapView/mapStyle';

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
}

/**
 * Mapbox GL Draw powered polygon drawing surface for the Add Site flow.
 * Only ever allows a single polygon at a time — drawing a new one replaces
 * the previous. Emits the current polygon feature (or null) on every
 * create/update/delete so the parent step can compute geometry stats.
 */
export function DrawMap({ onPolygonChange, className = '' }: DrawMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [runtimeError, setRuntimeError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  // Missing token is a static config problem, not runtime state — compute
  // it directly each render instead of syncing it into state via an effect.
  const loadError = !MAPBOX_TOKEN || runtimeError;

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    const container = containerRef.current;
    if (!container) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container,
        style: MAPBOX_STYLE_LIGHT,
        center: [78.9, 20.5],
        zoom: 4,
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
      controls: { polygon: true, trash: true },
      defaultMode: 'draw_polygon',
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
    };

    map.on('draw.create', enforceSinglePolygon);
    map.on('draw.update', emitPolygon);
    map.on('draw.delete', emitPolygon);

    map.on('load', () => setIsLoaded(true));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

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
        <div className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-md px-space-sm py-space-xs max-w-[240px]">
          <p className="font-label-technical text-label-micro text-on-surface-variant">
            Click to place vertices, double-click to finish. Click a drawn polygon to edit vertices.
            Press Delete/Backspace or the trash icon to remove it. Press Esc to cancel drawing.
          </p>
        </div>
      )}
    </div>
  );
}
