import { useNavigate } from 'react-router-dom';
import { Reveal } from '../Reveal/Reveal';

/**
 * Closing "luxury CTA" section on the deep obsidian forest background.
 */
export function CTA() {
  const navigate = useNavigate();

  return (
    <section
      id="about"
      className="w-full bg-primary text-on-primary py-margin-wide relative overflow-hidden scroll-mt-20"
    >
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary-container blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-tertiary-container blur-[160px]" />

      <Reveal className="w-full px-4 sm:px-gutter-lg max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-space-xs px-space-md py-1 bg-surface-container-highest/10 rounded-full mb-space-md">
          <span className="w-2 h-2 rounded-full bg-primary-fixed" />
          <span className="font-label-technical text-label-micro uppercase tracking-widest text-primary-fixed">
            DARUKAA PLANETARY GOVERNANCE
          </span>
        </div>
        <h2 className="font-display text-[2.25rem] md:text-display text-on-primary tracking-tight mb-space-md">
          The Earth is changing.
          <br />
          Your understanding should too.
        </h2>
        <p className="font-body-lg text-body-lg text-outline-variant max-w-2xl mx-auto mb-space-xl">
          Bring your environmental projects, discrete sites, and longitudinal impact telemetry
          into one intelligent geospatial platform.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-space-md">
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="group inline-flex items-center gap-space-sm bg-primary-fixed text-primary px-space-xl py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-300 shadow-lg hover:bg-on-primary"
          >
            <span>Start Exploring</span>
            <span
              className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1.5"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </button>
          <a
            href="#platform-preview"
            className="inline-flex items-center gap-space-sm bg-surface-container-highest/10 text-on-primary px-space-xl py-space-md rounded-lg font-headline-sm text-body-md transition-all duration-200 hover:bg-surface-container-highest/20"
          >
            <span>View Platform Demo</span>
          </a>
        </div>
        <div className="mt-space-xl pt-space-md flex flex-wrap items-center justify-center gap-space-lg text-outline-variant font-label-technical text-label-micro">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">verified</span> ISO 14064 READY
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">public</span> GLOBAL COVERAGE
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">security</span> SOC 2 TYPE II
            CERTIFIED
          </span>
        </div>
      </Reveal>
    </section>
  );
}
