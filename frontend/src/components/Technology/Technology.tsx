import type { SecurityFeature, TechBadge } from '../../types';
import { Reveal } from '../Reveal/Reveal';

const TECH_STACK: TechBadge[] = [
  { name: 'React', subtitle: 'TypeScript' },
  { name: 'FastAPI', subtitle: 'Async Python' },
  { name: 'PostGIS', subtitle: 'PostgreSQL 16' },
  { name: 'Mapbox', subtitle: 'GL Engine' },
];

const ARCHITECTURE_POINTS = [
  'Asynchronous spatial raster processing via Celery and GDAL workers',
  'PostGIS R-Tree spatial indexing for instantaneous polygon intersection checks',
  'Highcharts and WebGL for real-time 60fps rendering of multi-variable time series',
];

const SECURITY_FEATURES: SecurityFeature[] = [
  {
    title: 'JWT Authentication',
    description: 'Granular RBAC role delegation for auditors, managers, and field staff.',
  },
  {
    title: 'Encrypted At Rest',
    description: 'AES-256 field encryption for confidential concession boundaries.',
  },
  {
    title: 'Automated CI/CD',
    description: 'Continuous regression tests ensuring mathematical spatial precision.',
  },
  {
    title: 'Immutable Audit Trail',
    description: 'Every polygon edit or carbon delta revision is permanently logged.',
  },
];

/**
 * Technology / infrastructure & security section: stack badges,
 * architecture bullet points, and a security-feature grid.
 */
export function Technology() {
  return (
    <section id="about" className="w-full bg-surface-container-low py-margin-wide scroll-mt-20">
      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          <Reveal className="lg:col-span-6 flex flex-col">
            <span className="font-label-technical text-label-technical text-surface-tint uppercase tracking-widest font-semibold mb-space-xs">
              FULL-STACK PIPELINE
            </span>
            <h2 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-space-sm">
              Modern geospatial architecture.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-space-xl">
              Darukaa.Earth is engineered with a high-throughput, microservice data plane optimized
              for sub-second spatial vector queries and multi-gigabyte raster algebra.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mb-space-xl">
              {TECH_STACK.map((tech) => (
                <div
                  key={tech.name}
                  className="bg-surface-container-lowest p-space-sm rounded-lg text-center shadow-sm"
                >
                  <span className="font-headline-sm text-headline-sm text-primary block">
                    {tech.name}
                  </span>
                  <span className="font-label-technical text-label-micro text-on-surface-variant">
                    {tech.subtitle}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-space-sm">
              {ARCHITECTURE_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-surface-tint" aria-hidden="true">
                    check
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-medium">
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal
            delayMs={100}
            className="lg:col-span-6 bg-surface-container-lowest p-space-xl rounded-2xl shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center mb-space-md">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                lock
              </span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-primary mb-space-xs">
              Your environmental data, built on a secure foundation.
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
              Bank-grade cryptographic safeguards guarantee spatial datasets, land concessions, and
              carbon yields remain tamper-proof and verifiable.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              {SECURITY_FEATURES.map((feature) => (
                <div key={feature.title} className="p-space-md bg-surface-container-low rounded-xl">
                  <div className="font-headline-sm text-headline-sm text-primary">
                    {feature.title}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {feature.description}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
