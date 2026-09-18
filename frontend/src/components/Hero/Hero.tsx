import { Suspense, lazy } from 'react';
import { useCountUp } from '../../hooks/useCountUp';

// Three.js is a heavy dependency used purely for a decorative globe —
// lazy-load it so it doesn't inflate the initial landing page bundle.
const GlobeVisualization = lazy(() =>
  import('./GlobeVisualization').then((m) => ({ default: m.GlobeVisualization })),
);

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const { ref, value } = useCountUp<HTMLDivElement>({ target });
  return (
    <div ref={ref} className="font-headline-lg text-headline-lg text-primary leading-none">
      {value.toLocaleString()}
      {suffix}
    </div>
  );
}

/**
 * Hero section: editorial headline + CTAs + KPI micro-metas on the left,
 * rotating 3D globe visualizer with floating telemetry HUD cards on the
 * right. Ported 1:1 in structure/spacing/copy from the Stitch hero.
 */
export function Hero() {
  return (
    <section
      id="platform"
      className="relative w-full overflow-hidden bg-surface pt-space-xl pb-space-xl md:pb-margin-wide scroll-mt-20"
    >
      {/* Ambient gradient underlay */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full bg-primary-fixed/30 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/3 -right-20 w-[580px] h-[580px] rounded-full bg-tertiary-fixed/20 blur-[140px]" />

      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          {/* Left editorial copy */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col z-10">
            <div className="inline-flex items-center gap-space-sm px-space-md py-space-xs bg-surface-container-high/80 rounded-full w-fit mb-space-lg shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
              </span>
              <span className="font-label-technical text-label-technical uppercase tracking-wider text-primary">
                Geospatial intelligence for the future of carbon &amp; biodiversity
              </span>
            </div>

            <h1 className="font-display text-[2.75rem] md:text-display text-primary tracking-tight mb-space-md">
              Understand Earth.
              <br />
              Measure Impact.
              <br />
              <span className="text-surface-tint">Restore Better.</span>
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-space-xl">
              Darukaa.Earth transforms environmental project data into actionable geospatial
              intelligence — helping sovereign funds, carbon auditors, and land stewards map sites,
              monitor biometrics, and prove planetary restoration.
            </p>

            <div className="flex flex-wrap items-center gap-space-md">
              <a
                href="#platform-preview"
                className="group inline-flex items-center gap-space-sm bg-primary-container text-on-primary px-space-xl py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-300 shadow-md hover:bg-primary"
              >
                <span>Explore the Platform</span>
                <span
                  className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1.5"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-space-sm bg-surface-container-lowest text-primary px-space-lg py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-200 shadow-sm hover:bg-surface-container"
              >
                <span
                  className="material-symbols-outlined text-surface-tint text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  play_circle
                </span>
                <span>See How It Works</span>
              </a>
              <div className="hidden xl:flex items-center gap-space-xs pl-space-md text-on-surface-variant font-label-technical text-label-technical">
                <span
                  className="material-symbols-outlined text-[16px] text-surface-tint"
                  aria-hidden="true"
                >
                  radar
                </span>
                <span>WGS84 EPSG:4326 | SENTINEL-2 SYNCED</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-gutter-sm mt-space-xl pt-space-md">
              <div>
                <Counter target={4280} suffix="+" />
                <div className="font-label-technical text-label-technical text-on-surface-variant mt-1 uppercase">
                  Hectares Monitored
                </div>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-primary leading-none">
                  18.4K
                </div>
                <div className="font-label-technical text-label-technical text-on-surface-variant mt-1 uppercase">
                  tCO&#8322;e Sequestered
                </div>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-primary leading-none">
                  99.4%
                </div>
                <div className="font-label-technical text-label-technical text-on-surface-variant mt-1 uppercase">
                  Polygon Precision
                </div>
              </div>
            </div>
          </div>

          {/* Right visualizer + floating HUD */}
          <div className="lg:col-span-6 xl:col-span-5 relative flex items-center justify-center min-h-[480px] md:min-h-[580px] mt-space-xl lg:mt-0">
            <div className="absolute inset-0 bg-primary-fixed-dim/30 blur-3xl pointer-events-none rounded-full" />

            <div className="relative w-full h-[420px] md:h-[540px] lg:h-[580px] bg-surface-container-low/70 backdrop-blur-xl rounded-full overflow-hidden shadow-xl flex items-center justify-center">
              <Suspense fallback={<div className="w-full h-full" aria-hidden="true" />}>
                <GlobeVisualization />
              </Suspense>

              <div className="absolute top-4 left-6 flex items-center gap-space-xs font-label-technical text-label-micro text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>GEO-ORBIT FEED 04</span>
              </div>
              <div className="absolute bottom-4 right-6 font-label-technical text-label-micro text-on-surface-variant">
                <span>LAT 14.542&deg;N / LON 75.319&deg;E</span>
              </div>
            </div>

            {/* Floating HUD 1: Carbon Impact */}
            <div className="absolute -top-4 -left-2 md:-left-8 bg-surface-container-lowest/90 backdrop-blur-md p-space-md rounded-xl shadow-lg w-48 md:w-56 z-20 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
                  Carbon Impact
                </span>
                <span className="inline-flex items-center text-surface-tint font-label-technical text-label-micro font-semibold">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                    trending_up
                  </span>
                  +14.2%
                </span>
              </div>
              <div className="font-headline-md text-headline-md text-primary">
                +18.4K{' '}
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  tCO&#8322;e
                </span>
              </div>
              <svg
                className="w-full h-7 mt-2 text-surface-tint overflow-visible"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 100 24"
                aria-hidden="true"
              >
                <path
                  d="M0 20 Q 25 18, 40 12 T 70 8 T 100 2"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
                <path
                  d="M0 20 Q 25 18, 40 12 T 70 8 T 100 2 L 100 24 L 0 24 Z"
                  fill="currentColor"
                  fillOpacity="0.12"
                />
              </svg>
            </div>

            {/* Floating HUD 2: Biodiversity Index */}
            <div className="absolute top-1/3 -right-2 md:-right-8 bg-surface-container-lowest/90 backdrop-blur-md p-space-md rounded-xl shadow-lg w-44 md:w-52 z-20 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-technical text-label-technical text-on-surface-variant uppercase">
                  Biodiversity
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-surface-tint" />
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="font-headline-md text-headline-md text-primary">
                  86<span className="text-body-sm text-on-surface-variant">/100</span>
                </div>
                <span className="px-space-xs py-0.5 bg-primary-fixed text-primary font-label-technical text-label-micro rounded">
                  OPTIMAL
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-surface-tint h-full w-[86%] rounded-full" />
              </div>
            </div>

            {/* Floating HUD 3: Active Sites */}
            <div className="absolute bottom-16 -left-2 md:-left-10 bg-surface-container-lowest/90 backdrop-blur-md px-space-md py-space-sm rounded-xl shadow-lg flex items-center gap-space-md z-20">
              <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  pin_drop
                </span>
              </div>
              <div>
                <div className="font-label-technical text-label-technical text-on-surface-variant uppercase">
                  Active Sites
                </div>
                <div className="font-headline-sm text-headline-sm text-primary">38 Monitored</div>
              </div>
            </div>

            {/* Floating HUD 4: Area Monitored */}
            <div className="absolute -bottom-6 right-4 md:right-8 bg-surface-container-lowest/90 backdrop-blur-md px-space-md py-space-sm rounded-xl shadow-lg flex items-center gap-space-sm z-20">
              <span
                className="material-symbols-outlined text-surface-tint text-[18px]"
                aria-hidden="true"
              >
                satellite_alt
              </span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary leading-tight">
                  4,280 ha
                </span>
                <span className="font-label-technical text-label-micro text-on-surface-variant">
                  99.4% VERIFIED PRECISION
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
