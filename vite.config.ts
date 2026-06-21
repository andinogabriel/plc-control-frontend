import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// App version, surfaced in the UI footer (an "engineered product" detail).
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

// `vite build --mode analyze` (npm run build:analyze) writes a treemap of the bundle to
// dist/stats.html and opens it, so chunk growth is easy to spot. Normal builds are unaffected.
export default defineConfig(({ mode }) => ({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    ...(mode === 'analyze'
      ? [visualizer({ filename: 'dist/stats.html', open: true, gzipSize: true, brotliSize: true })]
      : []),
  ],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: false,
    // Playwright owns e2e/**; keep Vitest out of it.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // MUI 9 ships .mjs that directory-import react-transition-group, which Node's ESM resolver
    // (used by Vitest) rejects. Inline them so Vite's resolver handles it.
    server: { deps: { inline: [/@mui\//, 'react-transition-group'] } },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split heavy vendors into cacheable chunks. The per-package (object) form avoids
        // the circular-chunk pitfall of substring matching. Combined with route-level
        // React.lazy, the initial route stays small.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          mui: ['@mui/material', '@mui/system', '@mui/icons-material'],
          'mui-datagrid': ['@mui/x-data-grid'],
          'mui-charts': ['@mui/x-charts'],
          'mui-datepickers': ['@mui/x-date-pickers'],
        },
      },
    },
  },
}));
