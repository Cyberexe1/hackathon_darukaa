import type { ValuePillar } from '../../types';
import { Reveal } from '../Reveal/Reveal';

const PILLARS: ValuePillar[] = [
  {
    icon: 'polyline',
    title: 'Geospatial Mapping',
    description: 'Map every project and parcel. Geodesic coordinates with sub-meter vector integrity.',
  },
  {
    icon: 'co2',
    title: 'Carbon Intelligence',
    description:
      'Track sequestration yields over multi-year tranches backed by multispectral satellite audits.',
  },
  {
    icon: 'nature',
    title: 'Biodiversity Analytics',
    description: 'Evaluate floral canopy stratigraphy, habitat fragmentation, and ecological health scores.',
  },
  {
    icon: 'insights',
    title: 'Project Decisions',
    description: 'Convert raw orbital telemetry into definitive investment and compliance decisions.',
  },
];

/**
 * "Trust / value strip" — four pillar cards summarizing the platform's
 * integrated capabilities, directly under the hero.
 */
export function ValueStrip() {
  return (
    <section id="solutions" className="w-full bg-surface-container-low py-space-xl scroll-mt-20">
      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto">
        <Reveal className="flex flex-col items-center text-center mb-space-xl">
          <span className="font-label-technical text-label-technical uppercase tracking-widest text-on-surface-variant font-semibold">
            ONE INTEGRATED PLATFORM FOR ENVIRONMENTAL INTELLIGENCE
          </span>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delayMs={i * 80}>
              <div className="group bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-space-md group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                    {pillar.icon}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{pillar.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{pillar.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
