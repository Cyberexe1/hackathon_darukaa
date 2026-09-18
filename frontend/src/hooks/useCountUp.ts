import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  /** Final numeric value to count up to. */
  target: number;
  /** Total animation duration in ms. */
  duration?: number;
  /** Only start counting once the element enters the viewport. */
  triggerOnView?: boolean;
}

/**
 * Animates a number counting up from 0 to `target`, mirroring the
 * vanilla-JS counter script in the original Stitch hero section.
 * Returns a ref to attach to the element and the current display value.
 */
export function useCountUp<T extends HTMLElement = HTMLDivElement>({
  target,
  duration = 1200,
  triggerOnView = true,
}: UseCountUpOptions) {
  const ref = useRef<T | null>(null);
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const node = ref.current;
    // Tracked here (rather than only as a local inside `animate`) so the
    // effect's cleanup can always clear it, on every code path —
    // previously the early-return branch below (no IntersectionObserver/
    // `triggerOnView` false, e.g. always true in jsdom test environments)
    // never returned a cleanup function at all, so the interval kept
    // firing `setValue` after the component unmounted, occasionally
    // crashing test teardown with "window is not defined".
    let timer: ReturnType<typeof setInterval> | undefined;

    const animate = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = target / steps;
      let current = 0;

      timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setValue(target);
          clearInterval(timer);
        } else {
          setValue(Math.floor(current));
        }
      }, stepTime);
    };

    if (!triggerOnView || !node || !('IntersectionObserver' in window)) {
      animate();
      return () => clearInterval(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [target, duration, triggerOnView]);

  return { ref, value };
}
