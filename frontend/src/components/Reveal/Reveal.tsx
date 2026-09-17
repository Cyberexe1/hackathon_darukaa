import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

/** Restricted to the small set of block-level tags actually used across sections. */
type RevealTag = 'div' | 'section' | 'article';

interface RevealProps {
  children: ReactNode;
  as?: RevealTag;
  className?: string;
  id?: string;
  /** Delay in ms before the reveal transition starts, for staggered groups. */
  delayMs?: number;
  threshold?: number;
}

/**
 * Wraps content in a fade-up-on-scroll animation using IntersectionObserver.
 * This is the shared primitive used by every landing page section to
 * reproduce the Stitch "viewport-based reveal" animation language.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  id,
  delayMs = 0,
  threshold = 0.15,
}: RevealProps) {
  const { ref, isVisible } = useReveal<HTMLDivElement>(threshold);

  const style = delayMs ? { transitionDelay: `${delayMs}ms` } : undefined;
  const combinedClassName = `reveal ${isVisible ? 'reveal-visible' : ''} ${className}`;

  if (Tag === 'section') {
    return (
      <section ref={ref} id={id} className={combinedClassName} style={style}>
        {children}
      </section>
    );
  }

  if (Tag === 'article') {
    return (
      <article ref={ref} id={id} className={combinedClassName} style={style}>
        {children}
      </article>
    );
  }

  return (
    <div ref={ref} id={id} className={combinedClassName} style={style}>
      {children}
    </div>
  );
}
