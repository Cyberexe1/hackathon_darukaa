import type { WorkflowStep } from '../../types';
import { Reveal } from '../Reveal/Reveal';

const STEPS: WorkflowStep[] = [
  {
    index: '01',
    icon: 'add_location_alt',
    title: 'Create a Project',
    description:
      'Define the restoration initiative, target biome, governance parameters, and legal land-tenure covenants.',
    tag: 'STEP 01: INITIALIZE SCOPE',
  },
  {
    index: '02',
    icon: 'draw',
    title: 'Map Your Sites',
    description:
      'Draw precise parcel vector boundaries directly over high-res satellite orthoimagery or import Shapefile / GeoJSON.',
    tag: 'STEP 02: BOUNDARY DELINEATION',
  },
  {
    index: '03',
    icon: 'monitoring',
    title: 'Track Performance',
    description:
      'Continuous multispectral satellite polling detects canopy greenness, soil moisture, and carbon sequestration deltas.',
    tag: 'STEP 03: TELEMETRY SYNC',
  },
  {
    index: '04',
    icon: 'verified',
    title: 'Understand Change',
    description:
      'Generate tamper-proof audit certificates, export spatial data tranches, and prove verified additionality to stakeholders.',
    tag: 'STEP 04: EVIDENCE DISCLOSURE',
  },
];

/**
 * Four-step workflow protocol cards: create project -> map sites -> track
 * performance -> understand change.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-surface-container-low py-margin-wide scroll-mt-20">
      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto">
        <Reveal className="max-w-3xl mb-space-xl">
          <span className="font-label-technical text-label-technical text-surface-tint uppercase tracking-widest font-semibold block mb-space-xs">
            WORKFLOW PROTOCOL
          </span>
          <h2 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-space-sm">
            From map to measurable impact.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Four frictionless steps to bring physical restoration initiatives into continuous
            geospatial governance.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter relative">
          {STEPS.map((step, i) => (
            <Reveal key={step.index} delayMs={i * 90} className="h-full">
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm relative flex flex-col justify-between group hover:shadow-md transition-shadow h-full">
                <div>
                  <div className="flex items-center justify-between mb-space-md">
                    <span className="font-label-technical text-label-kpi text-surface-tint/40 font-bold">
                      {step.index}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        {step.icon}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-space-xs">{step.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{step.description}</p>
                </div>
                <div className="mt-space-lg pt-space-sm font-label-technical text-label-micro text-surface-tint">
                  {step.tag}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
