import { Reveal } from '../Reveal/Reveal';

const LAYER_TOGGLES = [
  {
    icon: 'forest',
    iconClass: 'text-primary',
    title: 'Canopy Cover Density',
    description: 'Multispectral band 8A / band 4 NDVI isolation',
    checked: true,
  },
  {
    icon: 'terrain',
    iconClass: 'text-secondary',
    title: 'Soil Organic Carbon (SOC)',
    description: 'Stratified 0-30cm mineral horizon depth model',
    checked: true,
  },
  {
    icon: 'water',
    iconClass: 'text-tertiary-container',
    title: 'Riparian Buffer Corridors',
    description: 'Automated 50m stream protection offsets',
    checked: false,
  },
];

/**
 * "Cartographic accuracy" section: layer toggle list on the left, an
 * animated polygon boundary-editor mockup on the right. Matches the
 * Stitch design's precision-mapping showcase.
 */
export function MapSection() {
  return (
    <section className="w-full bg-surface-container-low py-margin-wide">
      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          <Reveal className="lg:col-span-5 flex flex-col">
            <span className="font-label-technical text-label-technical text-surface-tint uppercase tracking-widest font-semibold mb-space-xs">
              CARTOGRAPHIC ACCURACY
            </span>
            <h2 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-space-md">
              Your projects, precisely mapped.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-space-lg">
              No approximations or square bounding boxes. Draw intricate parcel perimeters along
              rivers, ridges, and property lines. Darukaa calculates land surface area
              automatically across geodesic ellipsoids with zero planar distortion.
            </p>

            <div className="space-y-space-sm mb-space-xl">
              {LAYER_TOGGLES.map((layer) => (
                <label
                  key={layer.title}
                  className="flex items-center justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm cursor-pointer hover:bg-surface-bright transition-colors"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`material-symbols-outlined ${layer.iconClass}`} aria-hidden="true">
                      {layer.icon}
                    </span>
                    <div>
                      <div className="font-headline-sm text-headline-sm text-primary">{layer.title}</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">{layer.description}</div>
                    </div>
                  </div>
                  <input
                    defaultChecked={layer.checked}
                    className="w-5 h-5 rounded text-primary-container focus:ring-2 focus:ring-surface-tint"
                    type="checkbox"
                    aria-label={`Toggle ${layer.title} layer`}
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center gap-space-sm font-label-technical text-label-technical text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-surface-tint" aria-hidden="true">
                check_circle
              </span>
              <span>Compliant with Verra VM0042 &amp; Gold Standard Land Methodologies</span>
            </div>
          </Reveal>

          <Reveal delayMs={100} className="lg:col-span-7 relative">
            <div className="w-full bg-surface-container-lowest rounded-2xl p-space-lg shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-space-md flex-wrap gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary" aria-hidden="true">gesture</span>
                  <span className="font-headline-sm text-headline-sm text-primary">Boundary Editor // Site 04-A</span>
                </div>
                <span className="font-label-technical text-label-micro text-surface-tint bg-primary-fixed px-space-xs py-1 rounded">
                  GEODESIC ELLIPSOID: WGS 84
                </span>
              </div>

              <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden bg-surface-container">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-70"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBL36sOKjy9ixnF63Vf8kP8IKSi6i27SjeJDOrMqJ2uO3jYXeH9dmN7vTZoXa5g3wRz7Rfy36ig_ilf5dpnwOJf78NvdGERAXaoodiABxpLjJWVsF2v6R05TsEzdi1QXM-c6kdzTvsLf9j5Vtke_uivs4R5-8BpMavvCosyR9yOY1NgYw02axzbgqg5-1gFfxOUV3D7iAVHt6t-yA4ZuMGUKdtawAgzcUe2yaSoC5sLgB_XTjDCJ8BT')",
                  }}
                  role="img"
                  aria-label="Detailed geological aerial photography of lush green agricultural plot surrounded by natural forest ridge in misty morning light with visible elevation contrasts"
                />
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 600 320"
                  role="img"
                  aria-label="Animated parcel boundary polygon with locked coordinate vertices"
                >
                  <polygon
                    className="animate-pulse"
                    fill="#10B981"
                    fillOpacity="0.2"
                    points="90,70 280,40 510,110 470,260 210,280 120,200"
                    stroke="#12372a"
                    strokeDasharray="6 4"
                    strokeWidth="2"
                  />
                  <circle cx="90" cy="70" fill="#12372a" r="5" />
                  <circle cx="280" cy="40" fill="#12372a" r="5" />
                  <circle cx="510" cy="110" fill="#12372a" r="5" />
                  <circle cx="470" cy="260" fill="#12372a" r="5" />
                  <circle cx="210" cy="280" fill="#12372a" r="5" />
                  <circle cx="120" cy="200" fill="#12372a" r="5" />
                </svg>

                <div className="hidden sm:block absolute top-12 left-1/3 bg-surface-container-lowest/95 backdrop-blur-md p-space-sm rounded shadow-lg">
                  <div className="font-label-technical text-label-micro text-primary font-bold">VERTEX 2 [LOCKED]</div>
                  <div className="font-label-technical text-label-micro text-on-surface-variant">14.542&deg; N, 75.319&deg; E</div>
                  <div className="font-label-technical text-label-micro text-surface-tint">Elevation: 684m ASL</div>
                </div>

                <div className="absolute bottom-4 right-4 bg-primary-container text-on-primary px-space-md py-space-xs rounded-full font-label-technical text-label-micro shadow-md">
                  Area calculated: 142.8 Hectares &plusmn; 0.05%
                </div>
              </div>

              <div className="grid grid-cols-3 gap-space-md mt-space-md pt-space-md bg-surface-container-low p-space-md rounded-xl">
                <div>
                  <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                    Perimeter
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary">4,812 m</span>
                </div>
                <div>
                  <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                    Vertices
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary">6 Coords</span>
                </div>
                <div>
                  <span className="font-label-technical text-label-micro text-on-surface-variant uppercase block">
                    Projected CRS
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary">EPSG:32643</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
