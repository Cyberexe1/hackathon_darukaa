import type { GeoJSONPolygon, Site } from '../types/dashboard';

function polygon(coordinates: number[][]): GeoJSONPolygon {
  return { type: 'Polygon', coordinates: [coordinates] };
}

// Demo/synthetic site records with illustrative polygon boundaries. These
// coordinates approximate real regions for visual plausibility only and
// are not authoritative survey data.
export const mockSites: Site[] = [
  {
    id: 'site-western-ghats-a',
    project_id: 'proj-western-ghats',
    name: 'Western Ghats — Site A',
    description: 'Wet evergreen rainforest restoration reserve.',
    area_hectares: 142.8,
    perimeter_km: 4.812,
    centroid: { lat: 14.542, lon: 75.319 },
    geometry: polygon([
      [75.312, 14.548],
      [75.322, 14.55],
      [75.326, 14.542],
      [75.318, 14.534],
      [75.309, 14.538],
      [75.312, 14.548],
    ]),
    status: 'Active',
    created_at: '2022-02-01T09:00:00Z',
    updated_at: '2026-08-20T09:00:00Z',
  },
  {
    id: 'site-western-ghats-b',
    project_id: 'proj-western-ghats',
    name: 'Western Ghats — Site B',
    description: 'Ridge-line montane forest recovery block.',
    area_hectares: 98.4,
    perimeter_km: 3.9,
    centroid: { lat: 14.561, lon: 75.298 },
    geometry: polygon([
      [75.292, 14.568],
      [75.302, 14.57],
      [75.305, 14.56],
      [75.296, 14.554],
      [75.289, 14.559],
      [75.292, 14.568],
    ]),
    status: 'Active',
    created_at: '2022-04-11T09:00:00Z',
    updated_at: '2026-07-02T09:00:00Z',
  },
  {
    id: 'site-mangrove-a',
    project_id: 'proj-mangrove-conservation',
    name: 'Sundarbans — Site A',
    description: 'Estuarine mangrove replanting corridor.',
    area_hectares: 210.5,
    perimeter_km: 6.2,
    centroid: { lat: 21.947, lon: 89.18 },
    geometry: polygon([
      [89.172, 21.953],
      [89.186, 21.955],
      [89.19, 21.945],
      [89.178, 21.939],
      [89.168, 21.944],
      [89.172, 21.953],
    ]),
    status: 'Verified',
    created_at: '2023-03-15T09:00:00Z',
    updated_at: '2026-08-27T14:30:00Z',
  },
  {
    id: 'site-mangrove-b',
    project_id: 'proj-mangrove-conservation',
    name: 'Sundarbans — Site B',
    description: 'Storm-surge buffer replanting zone.',
    area_hectares: 175.0,
    perimeter_km: 5.4,
    centroid: { lat: 21.918, lon: 89.205 },
    geometry: polygon([
      [89.198, 21.924],
      [89.212, 21.926],
      [89.215, 21.915],
      [89.203, 21.91],
      [89.194, 21.916],
      [89.198, 21.924],
    ]),
    status: 'Active',
    created_at: '2023-05-02T09:00:00Z',
    updated_at: '2026-06-11T09:00:00Z',
  },
  {
    id: 'site-urban-biodiversity-a',
    project_id: 'proj-urban-biodiversity',
    name: 'Bengaluru — Cubbon Corridor',
    description: 'Urban green-corridor habitat reconnection patch.',
    area_hectares: 54.2,
    perimeter_km: 2.8,
    centroid: { lat: 12.976, lon: 77.594 },
    geometry: polygon([
      [77.588, 12.981],
      [77.6, 12.982],
      [77.602, 12.972],
      [77.591, 12.968],
      [77.584, 12.974],
      [77.588, 12.981],
    ]),
    status: 'In Review',
    created_at: '2026-06-10T09:00:00Z',
    updated_at: '2026-09-10T09:15:00Z',
  },
  {
    id: 'site-cascadia-a',
    project_id: 'proj-cascadia-evergreen',
    name: 'Cascadia — Site A',
    description: 'Old-growth reforestation demonstration block.',
    area_hectares: 340.5,
    perimeter_km: 7.1,
    centroid: { lat: 47.606, lon: -122.332 },
    geometry: polygon([
      [-122.34, 47.612],
      [-122.325, 47.614],
      [-122.32, 47.602],
      [-122.333, 47.597],
      [-122.344, 47.603],
      [-122.34, 47.612],
    ]),
    status: 'Active',
    created_at: '2021-10-01T09:00:00Z',
    updated_at: '2026-08-15T11:45:00Z',
  },
  {
    id: 'site-kalimantan-a',
    project_id: 'proj-kalimantan-peatland',
    name: 'Kalimantan Peatland 2',
    description: 'Peat swamp forest protection zone.',
    area_hectares: 520.0,
    perimeter_km: 9.8,
    centroid: { lat: -1.237, lon: 116.828 },
    geometry: polygon([
      [116.818, -1.229],
      [116.838, -1.227],
      [116.842, -1.243],
      [116.826, -1.249],
      [116.814, -1.24],
      [116.818, -1.229],
    ]),
    status: 'Verified',
    created_at: '2019-02-15T09:00:00Z',
    updated_at: '2026-01-05T08:00:00Z',
  },
];

export function getSiteById(id: string): Site | undefined {
  return mockSites.find((site) => site.id === id);
}

export function getSitesByProjectId(projectId: string): Site[] {
  return mockSites.filter((site) => site.project_id === projectId);
}
