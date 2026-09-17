import { create } from 'zustand';

export interface MapLayerVisibility {
  projects: boolean;
  sites: boolean;
  carbon: boolean;
  biodiversity: boolean;
  vegetation: boolean;
}

interface MapState {
  layers: MapLayerVisibility;
  toggleLayer: (layer: keyof MapLayerVisibility) => void;
  isSatellite: boolean;
  toggleSatellite: () => void;
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;
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
}));
