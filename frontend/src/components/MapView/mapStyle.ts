// Fill/line paint tokens shared by MapView's Mapbox layers, mirrored from
// the Darukaa.Earth "Obsidian Canopy" design tokens (index.css / DESIGN.md)
// so map polygons feel consistent with the rest of the product.
export const MAP_COLORS = {
  siteFill: '#12372a',
  siteFillHover: '#10b981',
  siteStroke: '#12372a',
  siteStrokeHover: '#10b981',
  projectFill: '#003640',
  projectStroke: '#00a7c3',
  vertex: '#ffffff',
} as const;

export const MAPBOX_STYLE_LIGHT = 'mapbox://styles/mapbox/light-v11';
export const MAPBOX_STYLE_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12';
