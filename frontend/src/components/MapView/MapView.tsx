import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Site } from '../../types/dashboard';
import { useMapStore, type AnalyticsMapMode } from '../../store/mapStore';
import { MAP_COLORS, MAPBOX_STYLE_LIGHT, MAPBOX_STYLE_SATELLITE } from './mapStyle';
import { ErrorState } from '../ErrorState/ErrorState';
import { MapSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { AnalyticsMapLegend } from './AnalyticsMapLegend';
import { ANALYTICS_MODE_COLORS } from './analyticsMapColors';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

interface MapViewProps {
  sites: Site[];
  selectedSiteId?: string | null;
  onSiteSelect?: (siteId: string) => void;
  /** Optional initial camera center; defaults to the average of all site centroids. */
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
  showLayerControl?: boolean;
  /**
   * Optional analytics visualization mode: when set to something other
   * than 'none', site polygons are shaded by relative intensity of the
   * selected metric (from `metricValues`) instead of the flat default
   * fill. This is a product visualization of the stored dataset, not a
   * scientific/satellite-derived heatmap — the legend labels it plainly
   * as "Low/Medium/High" relative intensity, never implying a calibrated
   * or scientifically-validated color scale.
   */
  analyticsMode?: AnalyticsMapMode;
  /** Maps site id -> the metric value used for analytics-mode shading
   * (e.g. each site's latest carbon_tco2e). Sites missing from this map
   * render with the default flat styling regardless of `analyticsMode`. */
  metricValues?: Record<string, number>;
}

function sitesToFeatureCollection(sites: Site[], metricValues?: Record<string, number>): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: sites.map((site) => ({
      type: 'Feature',
      id: site.id,
      properties: {
        id: site.id,
        name: site.name,
        area: site.area_hectares,
        metricValue: metricValues?.[site.id] ?? null,
      },
      geometry: site.geometry,
    })),
  };
}

/**
 * Reusable Mapbox GL JS map for displaying project/site boundary polygons.
 * Owns a single Mapbox GL instance for its lifetime and cleans it up on
 * unmount. Supports hover/click highlighting, popups, a satellite/map
 * style toggle, and a layer visibility control wired to `useMapStore`.
 *
 * Gracefully degrades to a friendly ErrorState if no Mapbox token is
 * configured, rather than throwing or rendering a broken canvas.
 */
export function MapView({
  sites,
  selectedSiteId,
  onSiteSelect,
  initialCenter,
  initialZoom = 6,
  className = '',
  showLayerControl = true,
  analyticsMode = 'none',
  metricValues,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [runtimeError, setRuntimeError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  // Missing token is a static config problem, not runtime state — compute
  // it directly each render instead of syncing it into state via an effect.
  const loadError = !MAPBOX_TOKEN || runtimeError;

  const layers = useMapStore((state) => state.layers);
  const isSatellite = useMapStore((state) => state.isSatellite);
  const toggleLayer = useMapStore((state) => state.toggleLayer);
  const toggleSatellite = useMapStore((state) => state.toggleSatellite);

  // Initialize the map once per mount / retry.
  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    const container = containerRef.current;
    if (!container) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const center =
      initialCenter ??
      (sites.length
        ? [
            sites.reduce((sum, s) => sum + s.centroid.lon, 0) / sites.length,
            sites.reduce((sum, s) => sum + s.centroid.lat, 0) / sites.length,
          ]
        : [78.9, 20.5]);

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container,
        style: MAPBOX_STYLE_LIGHT,
        center: center as [number, number],
        zoom: initialZoom,
        attributionControl: true,
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

    map.on('load', () => {
      map.addSource('sites', { type: 'geojson', data: sitesToFeatureCollection(sites, metricValues) });

      map.addLayer({
        id: 'sites-fill',
        type: 'fill',
        source: 'sites',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            MAP_COLORS.siteFillHover,
            ['boolean', ['feature-state', 'hover'], false],
            MAP_COLORS.siteFillHover,
            MAP_COLORS.siteFill,
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.45,
            ['boolean', ['feature-state', 'hover'], false],
            0.35,
            0.22,
          ],
        },
      });

      map.addLayer({
        id: 'sites-outline',
        type: 'line',
        source: 'sites',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            MAP_COLORS.siteStrokeHover,
            MAP_COLORS.siteStroke,
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3,
            1.5,
          ],
        },
      });

      let hoveredId: string | number | null = null;

      map.on('mousemove', 'sites-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features?.[0];
        if (!feature) return;

        if (hoveredId !== null && hoveredId !== feature.id) {
          map.setFeatureState({ source: 'sites', id: hoveredId }, { hover: false });
        }
        hoveredId = feature.id ?? null;
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'sites', id: hoveredId }, { hover: true });
        }

        const props = feature.properties as { name: string; area: number } | undefined;
        if (!props) return;

        if (!popupRef.current) {
          popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
        }
        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:'Plus Jakarta Sans',sans-serif;">
              <div style="font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;color:#151d19;">${props.name}</div>
              <div style="font-size:11px;color:#414844;margin-top:2px;">${props.area.toLocaleString()} ha</div>
            </div>`,
          )
          .addTo(map);
      });

      map.on('mouseleave', 'sites-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'sites', id: hoveredId }, { hover: false });
        }
        hoveredId = null;
        popupRef.current?.remove();
      });

      map.on('click', 'sites-fill', (e) => {
        const feature = e.features?.[0];
        const props = feature?.properties as { id: string } | undefined;
        if (props?.id) onSiteSelect?.(props.id);
      });

      setIsLoaded(true);
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  // Reflect selection state onto the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    sites.forEach((site) => {
      map.setFeatureState({ source: 'sites', id: site.id }, { selected: site.id === selectedSiteId });
    });
  }, [selectedSiteId, sites, isLoaded]);

  // Toggle satellite vs light basemap.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    map.setStyle(isSatellite ? MAPBOX_STYLE_SATELLITE : MAPBOX_STYLE_LIGHT);
    map.once('style.load', () => {
      map.addSource('sites', { type: 'geojson', data: sitesToFeatureCollection(sites, metricValues) });
      map.addLayer({
        id: 'sites-fill',
        type: 'fill',
        source: 'sites',
        paint: { 'fill-color': MAP_COLORS.siteFill, 'fill-opacity': 0.22 },
      });
      map.addLayer({
        id: 'sites-outline',
        type: 'line',
        source: 'sites',
        paint: { 'line-color': MAP_COLORS.siteStroke, 'line-width': 1.5 },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSatellite]);

  // Toggle sites layer visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    const visibility = layers.sites ? 'visible' : 'none';
    if (map.getLayer('sites-fill')) map.setLayoutProperty('sites-fill', 'visibility', visibility);
    if (map.getLayer('sites-outline')) map.setLayoutProperty('sites-outline', 'visibility', visibility);
  }, [layers.sites, isLoaded]);

  // Keep the source data (including `metricValue`) fresh if the sites
  // prop or metricValues change after init (e.g. switching the Analytics
  // page's selected metric, or the sites list updating).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    const source = map.getSource('sites') as mapboxgl.GeoJSONSource | undefined;
    source?.setData(sitesToFeatureCollection(sites, metricValues));
  }, [sites, metricValues, isLoaded]);

  // Analytics visualization mode: shade fill color by relative metric
  // intensity (data-driven `fill-color` expression) instead of the flat
  // default color, while leaving the outline layer's selection/hover
  // styling untouched. Reverts to the default expression when mode is
  // 'none'. This is a UI convenience over the already-loaded dataset —
  // not a new data source or scientific color scale.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !map.getLayer('sites-fill')) return;

    if (analyticsMode === 'none') {
      map.setPaintProperty('sites-fill', 'fill-color', [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        MAP_COLORS.siteFillHover,
        ['boolean', ['feature-state', 'hover'], false],
        MAP_COLORS.siteFillHover,
        MAP_COLORS.siteFill,
      ]);
      map.setPaintProperty('sites-fill', 'fill-opacity', [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.45,
        ['boolean', ['feature-state', 'hover'], false],
        0.35,
        0.22,
      ]);
      return;
    }

    const values = Object.values(metricValues ?? {}).filter((v) => Number.isFinite(v));
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const safeMax = max > min ? max : min + 1;
    const color = ANALYTICS_MODE_COLORS[analyticsMode];

    map.setPaintProperty('sites-fill', 'fill-color', [
      'case',
      ['==', ['get', 'metricValue'], null],
      MAP_COLORS.siteFill,
      [
        'interpolate',
        ['linear'],
        ['get', 'metricValue'],
        min,
        color.low,
        safeMax,
        color.high,
      ],
    ]);
    map.setPaintProperty('sites-fill', 'fill-opacity', [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      0.75,
      ['boolean', ['feature-state', 'hover'], false],
      0.65,
      0.55,
    ]);
  }, [analyticsMode, metricValues, isLoaded]);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-surface-container-high rounded-2xl ${className}`}>
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

      {isLoaded && showLayerControl && (
        <div className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-md p-space-sm max-w-[200px]">
          <p className="font-label-technical text-label-micro text-on-surface-variant uppercase mb-space-xs">Layers</p>
          {(['projects', 'sites', 'carbon', 'biodiversity', 'vegetation'] as const).map((layer) => (
            <label
              key={layer}
              className="flex items-center gap-space-xs py-1 cursor-pointer font-body-sm text-body-sm text-on-surface capitalize"
            >
              <input
                type="checkbox"
                checked={layers[layer]}
                onChange={() => toggleLayer(layer)}
                className="w-4 h-4 rounded text-primary-container focus:ring-2 focus:ring-surface-tint"
              />
              {layer}
            </label>
          ))}
        </div>
      )}

      {isLoaded && (
        <button
          type="button"
          onClick={toggleSatellite}
          className="absolute bottom-3 left-3 px-space-sm py-1.5 rounded-lg text-body-sm font-label-technical text-label-micro text-primary bg-surface-container-lowest/95 backdrop-blur-md shadow-md hover:bg-surface-container transition-colors"
        >
          {isSatellite ? 'Map' : 'Satellite'}
        </button>
      )}

      {isLoaded && analyticsMode !== 'none' && <AnalyticsMapLegend mode={analyticsMode} />}
    </div>
  );
}
