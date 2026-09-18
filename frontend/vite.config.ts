import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/react-router')) return 'react-router';
          if (id.includes('node_modules/mapbox-gl') || id.includes('node_modules/@mapbox'))
            return 'mapbox';
          if (id.includes('node_modules/highcharts')) return 'highcharts';
          if (id.includes('node_modules/@turf') || id.includes('node_modules/geojson-'))
            return 'turf';
        },
      },
    },
  },
});
