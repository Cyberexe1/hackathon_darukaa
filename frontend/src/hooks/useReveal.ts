import { useEffect, useRef, useState } from 'react';

/**
 * Viewport-triggered fade-up reveal animation.
 * Attach the returned ref to any element and apply the `reveal` class plus
 * conditionally `reveal-visible` (driven by `isVisible`) to animate the
 * element into view once, the first time it crosses the viewport.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  // If IntersectionObserver isn't supported, default to visible immediately
  // instead of toggling state from within the effect below.
  const [isVisible, setIsVisible] = useState(
    () => typeof window !== 'undefined' && !('IntersectionObserver' in window),
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
