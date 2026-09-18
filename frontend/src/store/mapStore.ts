import { create } from 'zustand';

export interface MapLayerVisibility {
  projects: boolean;
  sites: boolean;
  carbon: boolean;
  biodiversity: boolean;
  vegetation: boolean;
}

/** Which stored metric (if any) the map should visually encode as fill
 * intensity on site polygons. 'none' renders the default flat styling. */
export type AnalyticsMapMode = 'none' | 'carbon' | 'biodiversity' | 'vegetation' | 'treeCover';

interface MapState {
  layers: MapLayerVisibility;
  toggleLayer: (layer: keyof MapLayerVisibility) => void;
  isSatellite: boolean;
  toggleSatellite: () => void;
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;
  /** Drives the optional "Analytics" map layer (see MapView's
   * `metricValues`/`analyticsMode` props) — set from the Analytics page's
   * filter bar so selecting a metric there recolors the map without
   * touching any Mapbox-instance state directly. */
  analyticsMode: AnalyticsMapMode;
  setAnalyticsMode: (mode: AnalyticsMapMode) => void;
}

/**
 * Shared map UI state (layer toggles, basemap style, selected site) so the
 * dashboard overview map and the sites map can stay in sync without prop
 * drilling. Per-map-instance state (viewport, hover) stays local to
 * MapView.
 */
export const useMapStore = create<MapState>((set) => ({
  layers: {
    projects: true,
    sites: true,
    carbon: true,
    biodiversity: true,
    vegetation: true,
  },
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),

  isSatellite: false,
  toggleSatellite: () => set((state) => ({ isSatellite: !state.isSatellite })),

  selectedSiteId: null,
  setSelectedSiteId: (id) => set({ selectedSiteId: id }),

  analyticsMode: 'none',
  setAnalyticsMode: (mode) => set({ analyticsMode: mode }),
}));
