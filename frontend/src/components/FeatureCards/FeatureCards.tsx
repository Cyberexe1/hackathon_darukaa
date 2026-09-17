import type { FeatureCard } from '../../types';
import { Reveal } from '../Reveal/Reveal';

const FEATURES: FeatureCard[] = [
  {
    icon: 'map',
    title: 'Geospatial Intelligence',
    description:
      'Store, query, and analyze real geographic boundaries using high-performance PostGIS spatial indices with sub-meter coordinate integrity.',
    tag: 'POSTGIS // EPSG:4326 R-TREE INDEXING',
  },
  {
    icon: 'hub',
    title: 'Project Management',
    description:
      'Manage disparate multi-regional ecological projects and nested micro-sites from one centralized institutional command cockpit.',
    tag: 'MULTI-TENANT GOVERNANCE',
  },
  {
    icon: 'show_chart',
    title: 'Carbon Analytics',
    description:
      'Track carbon performance over time with automated uncertainty intervals, standard error modeling, and permanence risk monitoring.',
    tag: 'MONTE CARLO BIOMASS AUDITING',
  },
  {
    icon: 'eco',
    title: 'Biodiversity Monitoring',
    description:
      'Quantify habitat structural continuity, species richness potential, and corridor connectivity at parcel granularity.',
    tag: 'SHANNON-WIENER METRICS',
  },
  {
    icon: 'history',
    title: 'Historical Trends',
    description:
      'Compare 20-year archival satellite records against current restoration trajectory to prove real, unassailable additionality.',
    tag: 'LANDSAT 5/7/8/9 RETROSPECTIVE',
  },
  {
    icon: 'verified_user',
    title: 'Data-Driven Decisions',
    description:
      'Convert raw pixel data and reflectance bands into bankable environmental credits, sovereign disclosures, and capital disbursements.',
    tag: 'AUTOMATED DISCLOSURE PACKS',
  },
];

/**
 * Six-card "bento grid" of core platform capabilities.
 */
export function FeatureCards() {
  return (
    <section className="w-full bg-surface py-margin-wide">
      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto">
        <Reveal className="max-w-3xl mb-space-xl">
          <span className="font-label-technical text-label-technical text-surface-tint uppercase tracking-widest font-semibold block mb-space-xs">
            CORE PLATFORM CAPABILITIES
          </span>
          <h2 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-space-sm">
            Engineered for institutional scale.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Six foundational architectural pillars designed for high-conviction environmental
            asset allocation.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delayMs={(i % 3) * 90} className="h-full">
              <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center mb-space-lg">
                    <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-space-xs">{feature.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{feature.description}</p>
                </div>
                <div className="mt-space-lg font-label-technical text-label-micro text-surface-tint">
                  {feature.tag}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
