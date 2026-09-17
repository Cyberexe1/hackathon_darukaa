import type { Project } from '../types/dashboard';

// Demo/synthetic project records. This data is illustrative only and is
// clearly surfaced as "Demo data" in the UI wherever it is displayed.
export const mockProjects: Project[] = [
  {
    id: 'proj-western-ghats',
    name: 'Western Ghats Restoration',
    description:
      'Wet evergreen rainforest restoration reserve spanning multiple ridgelines in the Western Ghats biodiversity hotspot.',
    project_type: 'Forest Restoration',
    status: 'Active',
    country: 'India',
    region: 'Maharashtra',
    start_date: '2022-01-15',
    end_date: null,
    site_count: 8,
    total_area_hectares: 1240,
    updated_at: '2026-09-02T10:00:00Z',
  },
  {
    id: 'proj-mangrove-conservation',
    name: 'Mangrove Conservation',
    description:
      'Coastal mangrove conservation and replanting initiative protecting estuarine carbon sinks and storm-surge buffers.',
    project_type: 'Mangrove',
    status: 'Active',
    country: 'India',
    region: 'Sundarbans, West Bengal',
    start_date: '2023-03-01',
    end_date: null,
    site_count: 5,
    total_area_hectares: 680,
    updated_at: '2026-08-27T14:30:00Z',
  },
  {
    id: 'proj-urban-biodiversity',
    name: 'Urban Biodiversity',
    description:
      'Urban green-corridor biodiversity program reconnecting fragmented habitat patches across metropolitan parklands.',
    project_type: 'Biodiversity',
    status: 'Planning',
    country: 'India',
    region: 'Bengaluru, Karnataka',
    start_date: '2026-06-01',
    end_date: null,
    site_count: 4,
    total_area_hectares: 220,
    updated_at: '2026-09-10T09:15:00Z',
  },
  {
    id: 'proj-cascadia-evergreen',
    name: 'Cascadia Evergreen Canopy',
    description:
      'Temperate evergreen canopy restoration across the Pacific Northwest, focused on old-growth reforestation.',
    project_type: 'Forest Restoration',
    status: 'Active',
    country: 'United States',
    region: 'Washington',
    start_date: '2021-09-10',
    end_date: null,
    site_count: 6,
    total_area_hectares: 890,
    updated_at: '2026-08-15T11:45:00Z',
  },
  {
    id: 'proj-kalimantan-peatland',
    name: 'Kalimantan Peatland Protection',
    description:
      'Peat swamp forest protection and rewetting program reducing wildfire risk and long-term carbon release.',
    project_type: 'Wetland Conservation',
    status: 'Completed',
    country: 'Indonesia',
    region: 'Kalimantan',
    start_date: '2019-02-01',
    end_date: '2025-12-31',
    site_count: 3,
    total_area_hectares: 520,
    updated_at: '2026-01-05T08:00:00Z',
  },
  {
    id: 'proj-queensland-coastal',
    name: 'Queensland Coastal Agroforestry',
    description:
      'Silvopasture and agroforestry transition program supporting smallholder farms along the Queensland coastline.',
    project_type: 'Agroforestry',
    status: 'Paused',
    country: 'Australia',
    region: 'Queensland',
    start_date: '2024-04-01',
    end_date: null,
    site_count: 2,
    total_area_hectares: 96,
    updated_at: '2026-05-20T16:20:00Z',
  },
];

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((project) => project.id === id);
}
