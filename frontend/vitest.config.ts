import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Separate config from vite.config.ts (kept minimal/production-focused)
// so `vitest` doesn't need to reason about the app's build-time chunking
// strategy. Uses jsdom since Mapbox GL JS needs a DOM but not real WebGL
// — the tests mock `mapbox-gl` entirely rather than attempting to render
// a real WebGL canvas in a headless environment.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    // Explicit imports (`import { describe, it, expect } from 'vitest'`)
    // in every test file instead of `globals: true` — avoids needing to
    // add vitest's global type declarations to tsconfig.app.json, which
    // is also used by `tsc -b` for the production build.
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
