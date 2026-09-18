import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom has no `CSS.supports` (real browsers do) — Highcharts checks it
// during module init to decide whether to use SVG or CSS-based text
// rendering, and throws if it's missing entirely. This is a jsdom
// environment gap, not something under this app's control, so it's
// polyfilled once here rather than mocking Highcharts itself in every
// test that renders a chart component.
if (typeof window !== 'undefined' && !window.CSS) {
  // @ts-expect-error - minimal polyfill, only the members Highcharts checks.
  window.CSS = { supports: () => false };
} else if (typeof window !== 'undefined' && !window.CSS.supports) {
  window.CSS.supports = () => false;
}

// `globals: false` in vitest.config.ts means Testing Library's automatic
// cleanup (which normally hooks into a global `afterEach`) never
// registers itself — do it explicitly so each test starts with a fresh
// DOM instead of accumulating elements (e.g. duplicate "Next" buttons)
// across tests within the same file.
afterEach(() => {
  cleanup();
});
