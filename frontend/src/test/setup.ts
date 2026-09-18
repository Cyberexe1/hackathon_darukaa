import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// `globals: false` in vitest.config.ts means Testing Library's automatic
// cleanup (which normally hooks into a global `afterEach`) never
// registers itself — do it explicitly so each test starts with a fresh
// DOM instead of accumulating elements (e.g. duplicate "Next" buttons)
// across tests within the same file.
afterEach(() => {
  cleanup();
});
