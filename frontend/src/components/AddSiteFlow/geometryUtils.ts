import { area as turfArea, length as turfLength, centroid as turfCentroid } from '@turf/turf';
import type { Feature, Polygon } from 'geojson';
import type { GeoJSONPolygon } from '../../types/dashboard';

export interface GeometrySummary {
  areaHectares: number;
  perimeterKm: number;
  centroid: { lat: number; lon: number };
}

/**
 * Computes area (hectares), perimeter (km), and centroid from a drawn
 * GeoJSON polygon feature using Turf.js geodesic calculations. This is
 * the same computation the backend will eventually perform authoritatively
 * once the geometry is persisted as a PostGIS polygon — here it's used for
 * immediate user-facing feedback in the Review step.
 */
export function computeGeometrySummary(feature: Feature<Polygon>): GeometrySummary {
  const areaSqMeters = turfArea(feature);
  const perimeterKm = turfLength(feature, { units: 'kilometers' });
  const center = turfCentroid(feature);
  const [lon, lat] = center.geometry.coordinates;

  return {
    areaHectares: Math.round((areaSqMeters / 10000) * 100) / 100,
    perimeterKm: Math.round(perimeterKm * 100) / 100,
    centroid: { lat: Math.round(lat * 10000) / 10000, lon: Math.round(lon * 10000) / 10000 },
  };
}

export function toGeoJSONPolygon(feature: Feature<Polygon>): GeoJSONPolygon {
  return {
    type: 'Polygon',
    coordinates: feature.geometry.coordinates,
  };
}
