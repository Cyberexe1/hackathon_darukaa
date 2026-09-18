const FOOTER_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
  { label: 'Privacy', href: '#privacy' },
  { label: 'Terms', href: '#terms' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/40 py-space-xl">
      <div className="w-full px-4 sm:px-gutter-lg max-w-[1720px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg pb-space-lg border-b border-outline-variant/30">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-on-primary text-[14px]"
                  aria-hidden="true"
                >
                  public
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm text-primary uppercase tracking-wider">
                DARUKAA.EARTH
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
              Geospatial intelligence for environmental impact
            </p>
          </div>
          <nav
            className="flex flex-wrap items-center gap-x-space-lg gap-y-space-xs"
            aria-label="Footer"
          >
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <span className="font-label-technical text-label-technical text-on-surface-variant">
            LAT/LONG COORD: VERIFIED PLANETARY METRICS
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            &copy; {year} Darukaa.Earth. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
