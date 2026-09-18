import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useScrolled } from '../../hooks/useScrolled';

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
];

/**
 * Sticky primary navigation. Transparent over the hero, transitions to a
 * frosted glass "nav-blur-scroll" surface once the user scrolls, matching
 * the Stitch navbar behaviour. Includes a mobile hamburger menu and routes
 * Sign In to /signin and Get Started to /signup (no auth wired up yet).
 */
export function Navbar() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goToSignIn = () => {
    setMobileOpen(false);
    navigate('/signin');
  };

  const goToSignUp = () => {
    setMobileOpen(false);
    navigate('/signup');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-surface/75 nav-blur-scroll border-outline-variant/30'
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="h-20 w-full px-4 sm:px-gutter-lg flex items-center justify-between max-w-[1720px] mx-auto">
        <Link to="/" className="flex items-center gap-space-md" aria-label="Darukaa.Earth home">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-on-primary text-[18px]"
              aria-hidden="true"
            >
              public
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-primary leading-none">
              DARUKAA.EARTH
            </span>
            <span className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-widest mt-1 hidden sm:block">
              GEOSPATIAL INTELLIGENCE
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-space-lg" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href);
              }}
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-space-md">
          <button
            type="button"
            onClick={goToSignIn}
            className="hidden sm:inline-flex font-body-sm text-body-sm text-on-surface-variant hover:text-primary px-space-sm py-space-xs transition-colors"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={goToSignUp}
            className="group inline-flex items-center gap-space-xs bg-primary-container text-on-primary px-space-md py-space-sm rounded-full font-headline-sm text-body-sm shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:bg-primary transition-all duration-200"
          >
            <span>Get Started</span>
            <span
              className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </button>
          <button
            type="button"
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="lg:hidden bg-surface/95 nav-blur-scroll border-t border-outline-variant/30 px-4 py-space-md flex flex-col gap-space-sm"
          aria-label="Mobile"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href);
              }}
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary py-space-xs transition-colors"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={goToSignIn}
            className="sm:hidden font-body-md text-body-md text-on-surface-variant hover:text-primary py-space-xs text-left transition-colors"
          >
            Sign In
          </button>
        </nav>
      )}
    </header>
  );
}
