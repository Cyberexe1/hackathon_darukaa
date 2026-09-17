import { useEffect, useState } from 'react';

/**
 * Tracks whether the page has been scrolled past a threshold.
 * Used by the Navbar to switch from a transparent hero-blended state
 * to a frosted, blurred "scrolled" state (matches the Stitch nav-blur-scroll
 * behaviour).
 */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
