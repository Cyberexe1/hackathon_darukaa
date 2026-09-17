import { Reveal } from '../Reveal/Reveal';

const TELEMETRY_METRICS = [
  { label: 'Carbon Sequestration', value: '+12.8%', unit: 'YoY', description: 'Verified above-ground biomass' },
  { label: 'Species Density', value: '+8.4%', unit: 'density', description: 'Acoustic & structural index' },
  { label: 'Canopy Stratigraphy', value: '+14.2%', unit: 'cover', description: 'Multi-tier crown closure' },
  { label: 'Sensor Constellation', value: '10m / 5-Day', unit: '', description: 'Multispectral refresh cadence' },
];

/**
 * Deep nocturnal "command center" section — the dark bioluminescent
 * counterpart to the rest of the light-mode page. Radar sweep visual +
 * telemetry metric grid, matching the Stitch "Environmental Data Command
 * Center" section.
 */
export function DataCommandCenter() {
  return (
    <section className="w-full bg-tertiary text-on-tertiary py-margin-wide relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-tertiary-container/80 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-24 left-10 w-96 h-96 rounded-full bg-primary-container/60 blur-[140px]" />

      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          <Reveal className="lg:col-span-5 flex flex-col">
            <div className="inline-flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-highest/10 rounded-full w-fit mb-space-md">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
              <span className="font-label-technical text-label-micro uppercase tracking-widest text-tertiary-fixed">
                NOCTURNAL SPECTRAL ENGINE
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-tertiary tracking-tight mb-space-md">
              Earth, translated into data.
            </h2>
            <p className="font-body-lg text-body-lg text-outline-variant mb-space-xl">
              Our multispectral data pipeline fuses Sentinel-2 MSI, Landsat-9, and synthetic
              aperture radar (SAR) to penetrate cloud cover and provide unbroken biophysical
              telemetry.
            </p>

            <div className="grid grid-cols-2 gap-space-md">
              {TELEMETRY_METRICS.map((metric) => (
                <div key={metric.label} className="p-space-md bg-surface-container-highest/5 rounded-xl">
                  <div className="font-label-technical text-label-micro text-tertiary-fixed-dim uppercase">
                    {metric.label}
                  </div>
                  <div className="font-headline-md text-headline-md text-on-tertiary mt-1">
                    {metric.value}{' '}
                    {metric.unit && (
                      <span className="font-label-technical text-label-micro text-outline-variant font-normal">
                        {metric.unit}
                      </span>
                    )}
                  </div>
                  <div className="font-body-sm text-label-micro text-outline-variant mt-1">{metric.description}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delayMs={100} className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-xl aspect-square relative bg-surface-container-highest/5 rounded-full p-8 flex items-center justify-center">
              <div className="absolute inset-10 rounded-full border border-tertiary-fixed-dim/20" />
              <div className="absolute inset-24 rounded-full border border-tertiary-fixed-dim/20" />
              <div className="absolute inset-36 rounded-full border border-tertiary-fixed-dim/30" />

              <div
                className="absolute inset-0 rounded-full pointer-events-none flex items-center justify-center animate-[spin_12s_linear_infinite]"
                aria-hidden="true"
              >
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-tertiary-fixed to-transparent opacity-40 rotate-45" />
                <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-tertiary-fixed to-transparent opacity-40 rotate-45" />
              </div>

              <div className="relative z-10 text-center bg-surface-container-highest/10 backdrop-blur-xl p-space-lg rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container mx-auto flex items-center justify-center mb-space-sm shadow-md">
                  <span className="material-symbols-outlined text-[24px]" aria-hidden="true">satellite_alt</span>
                </div>
                <div className="font-label-technical text-label-micro text-tertiary-fixed uppercase">
                  SENTINEL-2 MSI // PASS 892
                </div>
                <div className="font-headline-md text-headline-md text-on-tertiary mt-1">100% Surface Coverage</div>
                <div className="font-label-technical text-label-micro text-outline-variant mt-1">
                  Zero Cloud Obscuration Detected
                </div>
              </div>

              <div className="hidden md:block absolute top-20 left-20 bg-surface-container-highest/10 backdrop-blur-md px-space-sm py-space-xs rounded font-label-technical text-label-micro text-tertiary-fixed">
                + SOC 28.4 g/kg
              </div>
              <div className="hidden md:block absolute bottom-20 right-20 bg-surface-container-highest/10 backdrop-blur-md px-space-sm py-space-xs rounded font-label-technical text-label-micro text-tertiary-fixed-dim">
                + CHM: 32.4m CANOPY
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
