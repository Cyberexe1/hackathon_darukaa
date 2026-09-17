import type { SiteRegistryRow } from '../../types';
import { Reveal } from '../Reveal/Reveal';

const SITE_REGISTRY: SiteRegistryRow[] = [
  {
    name: 'Western Ghats — Site A',
    coordinates: 'LAT 14.542° N, LON 75.319° E',
    area: '142.8 ha',
    carbon: '2,840 tCO₂e',
    biodiversity: '86 / 100',
    status: 'Active',
  },
  {
    name: 'Amazon Corridor — Site 04',
    coordinates: 'LAT 03.119° S, LON 60.021° W',
    area: '890.2 ha',
    carbon: '6,120 tCO₂e',
    biodiversity: '91 / 100',
    status: 'Verified',
  },
  {
    name: 'Cascadia Evergreen',
    coordinates: 'LAT 47.606° N, LON 122.332° W',
    area: '340.5 ha',
    carbon: '3,450 tCO₂e',
    biodiversity: '84 / 100',
    status: 'In Review',
  },
  {
    name: 'Kalimantan Peatland 2',
    coordinates: 'LAT 01.237° S, LON 116.828° E',
    area: '520.0 ha',
    carbon: '4,280 tCO₂e',
    biodiversity: '88 / 100',
    status: 'Active',
  },
];

const STATUS_STYLES: Record<SiteRegistryRow['status'], string> = {
  Active: 'bg-primary-fixed text-primary',
  Verified: 'bg-primary-fixed text-primary',
  'In Review': 'bg-secondary-container text-on-secondary-fixed',
};

const STATUS_DOT: Record<SiteRegistryRow['status'], string> = {
  Active: 'bg-surface-tint',
  Verified: 'bg-surface-tint',
  'In Review': 'bg-secondary',
};

/**
 * Analytics section: three SVG data visualizations (carbon sequestration,
 * biodiversity score, NDVI vegetation index) plus a site registry audit
 * table. Charts are hand-drawn SVG paths matching the Stitch mockups —
 * the production dashboard will replace these with Highcharts.
 */
export function AnalyticsPreview() {
  return (
    <section id="analytics" className="w-full bg-surface py-margin-wide scroll-mt-20">
      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto">
        <Reveal className="max-w-3xl mb-space-xl">
          <span className="font-label-technical text-label-technical text-surface-tint uppercase tracking-widest font-semibold block mb-space-xs">
            TEMPORAL VERIFICATION
          </span>
          <h2 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-space-sm">
            Measure what changes.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Environmental impact is never a static snapshot. Darukaa monitors vegetative
            maturation, biomass accretion, and biodiversity recovery over decades.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-space-xl">
          {/* Chart 1: Carbon Sequestration */}
          <Reveal className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm h-full">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
                Carbon Sequestration
              </span>
              <span className="font-label-technical text-label-micro text-surface-tint font-bold">+338% NET</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-primary mb-2">
              18.4K <span className="text-body-sm font-normal text-on-surface-variant">tCO&#8322;e</span>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              Annual incremental carbon capture from 2022 to 2026.
            </div>
            <svg className="w-full h-36 overflow-visible text-primary-container" fill="none" viewBox="0 0 280 120" role="img" aria-label="Line chart showing carbon sequestration rising from 4.2 thousand to 18.4 thousand tonnes CO2 equivalent between 2022 and 2026">
              <defs>
                <linearGradient id="grad-carbon" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#12372a" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#12372a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,105 C60,95 100,70 140,55 C180,40 220,25 280,10 L280,120 L0,120 Z" fill="url(#grad-carbon)" />
              <path d="M0,105 C60,95 100,70 140,55 C180,40 220,25 280,10" stroke="#12372a" strokeLinecap="round" strokeWidth="3" />
              <circle cx="0" cy="105" fill="#12372a" r="4" />
              <circle cx="140" cy="55" fill="#12372a" r="4" />
              <circle cx="280" cy="10" fill="#12372a" r="5" />
            </svg>
            <div className="flex justify-between font-label-technical text-label-micro text-on-surface-variant mt-space-sm pt-space-xs">
              <span>2022 (4.2k)</span>
              <span>2024 (11.0k)</span>
              <span>2026 (18.4k)</span>
            </div>
          </Reveal>

          {/* Chart 2: Biodiversity Score */}
          <Reveal delayMs={80} className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm h-full">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
                Biodiversity Score
              </span>
              <span className="font-label-technical text-label-micro text-surface-tint font-bold">TARGET: 85</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-primary mb-2">
              86 <span className="text-body-sm font-normal text-on-surface-variant">/ 100 Index</span>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              Shannon-Wiener habitat complexity index progression.
            </div>
            <svg className="w-full h-36 overflow-visible" fill="none" viewBox="0 0 280 120" role="img" aria-label="Bar chart showing biodiversity score progression from 72 to 86 over four years against a target of 85">
              <line stroke="#717974" strokeDasharray="4 4" strokeOpacity="0.3" x1="0" x2="280" y1="35" y2="35" />
              <text className="font-label-technical" fontSize="10" fill="#717974" x="235" y="30">TGT: 85</text>
              <rect fill="#c3ebd8" height="65" rx="4" width="40" x="20" y="55" />
              <rect fill="#a8cfbd" height="76" rx="4" width="40" x="85" y="44" />
              <rect fill="#7ba190" height="82" rx="4" width="40" x="150" y="38" />
              <rect fill="#12372a" height="98" rx="4" width="40" x="215" y="22" />
            </svg>
            <div className="flex justify-between font-label-technical text-label-micro text-on-surface-variant mt-space-sm pt-space-xs">
              <span>Y1 (72)</span>
              <span>Y2 (78)</span>
              <span>Y3 (81)</span>
              <span className="font-bold text-primary">Y4 (86)</span>
            </div>
          </Reveal>

          {/* Chart 3: NDVI */}
          <Reveal delayMs={160} className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm h-full">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
                Mean NDVI Density
              </span>
              <span className="font-label-technical text-label-micro text-surface-tint font-bold">+28.1% DELTA</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-primary mb-2">
              0.78 <span className="text-body-sm font-normal text-on-surface-variant">NDVI</span>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              Canopy density calibrated across wet and dry seasons.
            </div>
            <svg className="w-full h-36 overflow-visible text-surface-tint" fill="none" viewBox="0 0 280 120" role="img" aria-label="Line chart showing NDVI vegetation index rising seasonally from 0.64 baseline to 0.82 wet-season peak">
              <path d="M0,85 Q35,60 70,75 T140,50 T210,40 T280,22" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="70" cy="75" fill="currentColor" r="3.5" />
              <circle cx="140" cy="50" fill="currentColor" r="3.5" />
              <circle cx="210" cy="40" fill="currentColor" r="3.5" />
              <circle cx="280" cy="22" fill="#12372a" r="5" />
            </svg>
            <div className="flex justify-between font-label-technical text-label-micro text-on-surface-variant mt-space-sm pt-space-xs">
              <span>0.64 Baseline</span>
              <span>0.71 Mid</span>
              <span>0.82 Wet Peak</span>
            </div>
          </Reveal>
        </div>

        {/* Site registry table */}
        <Reveal className="w-full bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div>
              <h3 className="font-headline-md text-headline-md text-primary">Site Registry Audit Matrix</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Consolidated telemetry across active global project coordinates.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-space-md py-space-xs bg-surface-container-high text-primary rounded-lg font-body-sm text-body-sm hover:bg-surface-container transition-colors self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">tune</span>
              Filter Sites
            </button>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low font-label-technical text-label-micro text-on-surface-variant uppercase">
                  <th scope="col" className="py-space-sm px-space-lg">Site Identifier</th>
                  <th scope="col" className="py-space-sm px-space-md">Surface Area</th>
                  <th scope="col" className="py-space-sm px-space-md">Carbon Yield</th>
                  <th scope="col" className="py-space-sm px-space-md">Biodiversity</th>
                  <th scope="col" className="py-space-sm px-space-md">Audit Status</th>
                  <th scope="col" className="py-space-sm px-space-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
                {SITE_REGISTRY.map((site) => (
                  <tr key={site.name} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-space-md px-space-lg">
                      <div className="font-headline-sm text-headline-sm text-primary">{site.name}</div>
                      <div className="font-label-technical text-label-micro text-on-surface-variant">{site.coordinates}</div>
                    </td>
                    <td className="py-space-md px-space-md text-primary font-medium">{site.area}</td>
                    <td className="py-space-md px-space-md text-surface-tint font-semibold">{site.carbon}</td>
                    <td className="py-space-md px-space-md">
                      <span className="inline-flex items-center gap-1 font-medium text-primary">{site.biodiversity}</span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-technical text-label-micro ${STATUS_STYLES[site.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[site.status]}`} />
                        {site.status}
                      </span>
                    </td>
                    <td className="py-space-md px-space-lg text-right">
                      <button type="button" className="text-surface-tint hover:text-primary font-label-technical text-label-micro">
                        VIEW TELEMETRY &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
