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

/**
 * Parses a pasted/uploaded GeoJSON string for the "Import Polygon" action
 * into a single `Feature<Polygon>`. Accepts a bare `Polygon` geometry, a
 * `Feature` wrapping one, or a `FeatureCollection` (the first Polygon
 * feature found is used).
 *
 * This is only a convenience parser for fast client-side feedback — it
 * intentionally does not try to replicate every check the backend runs.
 * The backend (`geospatial_service.py`) re-validates the geometry
 * authoritatively (ring closure, self-intersection, minimum vertices,
 * SRID) when the site is actually saved, exactly as it already does for
 * boundaries drawn by hand. Throws a plain `Error` with a user-facing
 * message on any problem.
 */
export function parseImportedPolygonGeoJSON(input: string): Feature<Polygon> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Paste a GeoJSON Polygon, Feature, or FeatureCollection first.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('That is not valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Expected a GeoJSON object.');
  }

  const root = parsed as { type?: unknown; features?: unknown; geometry?: unknown };
  let geometry: { type?: unknown; coordinates?: unknown } | undefined;

  if (root.type === 'FeatureCollection') {
    const features = root.features;
    const polygonFeature = Array.isArray(features)
      ? features.find(
          (f) =>
            typeof f === 'object' &&
            f !== null &&
            (f as { geometry?: { type?: unknown } }).geometry?.type === 'Polygon',
        )
      : undefined;
    geometry = (
      polygonFeature as { geometry?: { type?: unknown; coordinates?: unknown } } | undefined
    )?.geometry;
    if (!geometry) {
      throw new Error('No Polygon feature found in that FeatureCollection.');
    }
  } else if (root.type === 'Feature') {
    geometry = root.geometry as { type?: unknown; coordinates?: unknown } | undefined;
  } else if (root.type === 'Polygon') {
    geometry = root as { type?: unknown; coordinates?: unknown };
  } else {
    throw new Error('Expected a GeoJSON "Polygon", "Feature", or "FeatureCollection".');
  }

  if (!geometry || geometry.type !== 'Polygon') {
    throw new Error('Only Polygon geometries are supported.');
  }

  const coordinates = geometry.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    throw new Error('Polygon has no coordinate rings.');
  }

  const normalizedRings = coordinates.map((ring, ringIndex) => {
    if (!Array.isArray(ring) || ring.length < 4) {
      throw new Error(
        `Ring ${ringIndex + 1} needs at least 4 positions (including the closing point).`,
      );
    }
    for (const position of ring) {
      if (
        !Array.isArray(position) ||
        position.length < 2 ||
        typeof position[0] !== 'number' ||
        typeof position[1] !== 'number' ||
        Math.abs(position[0]) > 180 ||
        Math.abs(position[1]) > 90
      ) {
        throw new Error(
          'Each position must be [longitude, latitude], with longitude in [-180, 180] and latitude in [-90, 90].',
        );
      }
    }
    const first = ring[0] as number[];
    const last = ring[ring.length - 1] as number[];
    // A common paste mistake is an unclosed ring — close it automatically
    // instead of rejecting. The backend still enforces closure (and every
    // other geometry rule) strictly when the site is saved.
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return [...ring, [first[0], first[1]]] as number[][];
    }
    return ring as number[][];
  });

  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: normalizedRings },
  };
}
