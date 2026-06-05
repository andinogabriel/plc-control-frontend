/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: false,
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
});
