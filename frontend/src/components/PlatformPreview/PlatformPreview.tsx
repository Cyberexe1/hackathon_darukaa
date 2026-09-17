import { Reveal } from '../Reveal/Reveal';

/**
 * "SaaS console" simulation: a macOS-style window chrome containing the
 * KPI strip, sidebar navigation, interactive map canvas with SVG geo-fence
 * polygons, and a site detail drawer. Ported from the Stitch platform
 * section — this is a visual product preview only, not a live dashboard.
 */
export function PlatformPreview() {
  return (
    <section className="w-full py-margin-wide bg-surface overflow-hidden" aria-labelledby="platform-preview-heading">
      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto">
        <Reveal as="div" className="max-w-3xl mb-space-xl">
          <span className="font-label-technical text-label-technical text-surface-tint uppercase tracking-widest font-semibold block mb-space-xs">
            PLANETARY ENGINE &bull; COMMAND WORKSPACE
          </span>
          <h2 id="platform-preview-heading" className="font-headline-xl text-headline-xl text-primary tracking-tight mb-space-sm">
            From boundaries to biodiversity.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Every environmental restoration project starts with precise geographic terrain.
            Darukaa.Earth turns static geo-coordinates into continuous dynamic intelligence.
          </p>
        </Reveal>

        <Reveal id="platform-preview" className="w-full bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden">
          {/* Window chrome */}
          <div className="bg-surface-container-high px-space-md py-space-sm flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="w-3 h-3 rounded-full bg-rose-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
              <span className="font-label-technical text-label-micro text-on-surface-variant ml-space-md">
                DARUKAA OS // CONSOLE v2.4
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-space-md text-on-surface-variant font-label-technical text-label-micro">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container" /> LIVE SYNC
              </span>
              <span>PROJ: W-GHATS-01</span>
              <span>LAT 14.542&deg;N</span>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 bg-surface-container-low divide-x divide-outline-variant/10">
            <div className="p-space-md">
              <div className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                Portfolio Scope
              </div>
              <div className="font-headline-sm text-headline-sm text-primary">12 Active Projects</div>
            </div>
            <div className="p-space-md">
              <div className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                Mapped Parcels
              </div>
              <div className="font-headline-sm text-headline-sm text-primary">38 Discrete Sites</div>
            </div>
            <div className="p-space-md">
              <div className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                Surface Area
              </div>
              <div className="font-headline-sm text-headline-sm text-primary">4,280.4 Hectares</div>
            </div>
            <div className="p-space-md">
              <div className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                Net Sequestration
              </div>
              <div className="font-headline-sm text-headline-sm text-surface-tint">18,412 tCO&#8322;e</div>
            </div>
          </div>

          {/* Dashboard body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px] lg:min-h-[580px]">
            {/* Sidebar */}
            <div className="hidden lg:flex lg:col-span-2 bg-surface-container-lowest p-space-md flex-col justify-between">
              <div className="space-y-1">
                <div className="font-label-technical text-label-micro text-on-surface-variant uppercase px-space-xs mb-2">
                  Navigation
                </div>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-space-sm py-space-xs rounded-lg text-left font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      dashboard
                    </span>
                    Overview
                  </span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-space-sm py-space-xs rounded-lg text-left font-body-sm text-body-sm bg-primary-container text-on-primary font-medium"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      forest
                    </span>
                    Projects
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-primary text-on-primary font-label-technical text-label-micro">
                    12
                  </span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-space-sm py-space-xs rounded-lg text-left font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      pin_drop
                    </span>
                    Sites
                  </span>
                  <span className="font-label-technical text-label-micro text-on-surface-variant">38</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-space-sm py-space-xs rounded-lg text-left font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      query_stats
                    </span>
                    Analytics
                  </span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-space-sm py-space-xs rounded-lg text-left font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      history_edu
                    </span>
                    Audit Log
                  </span>
                </button>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-lg">
                <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                  LAYER ENGINE
                </span>
                <span className="font-body-sm text-body-sm text-primary font-semibold block mt-0.5">
                  Sentinel-2 MSI Level 2A
                </span>
                <span className="font-label-technical text-label-micro text-surface-tint block mt-1">
                  Refreshed 3h ago
                </span>
              </div>
            </div>

            {/* Map canvas */}
            <div className="lg:col-span-7 relative bg-surface-container-high overflow-hidden min-h-[320px] lg:min-h-[420px] flex items-center justify-center">
              <div
                className="absolute inset-0 w-full h-full opacity-60 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDfWm7_VFH9owl3txfvUP4RAlg5x99e5KJJS2TDNUSbRGUEgoO05rcTrhrT3qdcbMb6kTG9c3jBuSMi5u3o4t2haDtTKyWyoWC6XzOKVW9ExFtQ_BMwV1qR2viez06Nqlhqcbl3I0PSwfKQ9o2DAjGFQVkChk6XgwzmidcEAABGxJaTIVsLKUBBMwjxGiml00sR4evEG6Jw0i6cw4jG1AgYAAVMvU6sFOM_IchrM16q35qIYj0CBooU')",
                }}
                role="img"
                aria-label="Satellite top-down view of dense tropical evergreen canopy and river basin with intricate topographic contour lines and agricultural boundary divisions in subtle forest green and ochre tones"
              />
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                fill="none"
                viewBox="0 0 700 500"
                role="img"
                aria-label="Interactive map showing project site boundary polygons"
              >
                <line stroke="#717974" strokeDasharray="4 4" strokeOpacity="0.15" x1="0" x2="700" y1="125" y2="125" />
                <line stroke="#717974" strokeDasharray="4 4" strokeOpacity="0.15" x1="0" x2="700" y1="250" y2="250" />
                <line stroke="#717974" strokeDasharray="4 4" strokeOpacity="0.15" x1="0" x2="700" y1="375" y2="375" />
                <line stroke="#717974" strokeDasharray="4 4" strokeOpacity="0.15" x1="175" x2="175" y1="0" y2="500" />
                <line stroke="#717974" strokeDasharray="4 4" strokeOpacity="0.15" x1="350" x2="350" y1="0" y2="500" />
                <line stroke="#717974" strokeDasharray="4 4" strokeOpacity="0.15" x1="525" x2="525" y1="0" y2="500" />
                <polygon fill="#003640" fillOpacity="0.25" points="120,80 240,60 280,160 160,190" stroke="#00a7c3" strokeWidth="1.5" />
                <polygon fill="#6c5c46" fillOpacity="0.25" points="460,280 620,240 660,390 510,430 430,350" stroke="#72624b" strokeWidth="1.5" />
                <polygon
                  fill="#12372a"
                  fillOpacity="0.3"
                  points="260,180 460,150 510,290 380,360 240,310"
                  stroke="#12372a"
                  strokeWidth="2.5"
                />
                <circle cx="260" cy="180" fill="#ffffff" r="4.5" stroke="#12372a" strokeWidth="2" />
                <circle cx="460" cy="150" fill="#ffffff" r="4.5" stroke="#12372a" strokeWidth="2" />
                <circle cx="510" cy="290" fill="#ffffff" r="4.5" stroke="#12372a" strokeWidth="2" />
                <circle cx="380" cy="360" fill="#ffffff" r="4.5" stroke="#12372a" strokeWidth="2" />
                <circle cx="240" cy="310" fill="#ffffff" r="4.5" stroke="#12372a" strokeWidth="2" />
              </svg>

              <div className="hidden md:block absolute top-20 right-8 bg-primary-container text-on-primary px-space-sm py-space-xs rounded-md shadow-lg">
                <div className="flex items-center gap-space-xs font-label-technical text-label-micro">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>VERTEX 3: 14.5428&deg; N, 75.3191&deg; E</span>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md p-space-xs rounded-lg shadow-md flex items-center gap-1">
                <button type="button" className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-primary" aria-label="Zoom in">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                </button>
                <button type="button" className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-primary" aria-label="Zoom out">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">remove</span>
                </button>
                <div className="w-px h-4 bg-outline-variant/30" />
                <button type="button" className="px-space-xs py-1 rounded text-body-sm font-label-technical text-label-micro text-primary hover:bg-surface-container flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">layers</span> Layers
                </button>
                <button type="button" className="px-space-xs py-1 rounded text-body-sm font-label-technical text-label-micro text-primary hover:bg-surface-container">
                  Satellite
                </button>
              </div>

              <div className="absolute top-[48%] left-[45%] -translate-x-1/2 -translate-y-1/2 bg-surface-container-lowest/90 backdrop-blur px-space-sm py-space-xs rounded shadow-sm text-center">
                <span className="font-headline-sm text-headline-sm text-primary block leading-none">SITE A</span>
                <span className="font-label-technical text-label-micro text-on-surface-variant">142.8 Hectares</span>
              </div>
            </div>

            {/* Site detail drawer */}
            <div className="lg:col-span-3 bg-surface-container-lowest p-space-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="px-space-xs py-0.5 rounded bg-primary-fixed text-primary font-label-technical text-label-micro">
                    VERIFIED PARCEL
                  </span>
                  <span className="flex items-center gap-1 font-label-technical text-label-micro text-surface-tint">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-tint" /> ACTIVE
                  </span>
                </div>
                <h4 className="font-headline-md text-headline-md text-primary mb-1">Western Ghats — Site A</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                  Wet evergreen rainforest restoration reserve.
                </p>
                <div className="space-y-space-sm mb-space-md">
                  <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                      Total Area
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary">142.8 ha</span>
                  </div>
                  <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                      Biomass Carbon
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary">2,840 tCO&#8322;e</span>
                  </div>
                  <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                      Biodiversity Score
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary">86 / 100</span>
                  </div>
                  <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                    <span className="font-label-technical text-label-micro text-on-surface-variant uppercase">
                      Mean NDVI Index
                    </span>
                    <span className="font-headline-sm text-headline-sm text-surface-tint">0.78 &plusmn; 0.04</span>
                  </div>
                </div>
              </div>
              <div className="space-y-space-xs">
                <button
                  type="button"
                  className="w-full bg-primary-container text-on-primary py-space-sm rounded-lg font-headline-sm text-body-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
                  Export GeoJSON
                </button>
                <button
                  type="button"
                  className="w-full bg-surface-container text-primary py-space-sm rounded-lg font-headline-sm text-body-sm flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">file_open</span>
                  Run Biomass Audit
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
