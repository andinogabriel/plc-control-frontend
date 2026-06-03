import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { Layout } from './components/Layout';

// Route-level code splitting: each page is its own chunk, loaded on demand.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage').then((m) => ({ default: m.ConfigurationPage })));
const ConfigHistoryPage = lazy(() => import('./pages/ConfigHistoryPage').then((m) => ({ default: m.ConfigHistoryPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/tablero" replace />} />
          <Route path="/tablero" element={<DashboardPage />} />
          <Route path="/configuracion" element={<ConfigurationPage />} />
          <Route path="/historial-configuracion" element={<ConfigHistoryPage />} />
          <Route path="/mediciones" element={<HistoryPage />} />

          {/* Backwards-compatible redirects from the previous English paths. */}
          <Route path="/dashboard" element={<Navigate to="/tablero" replace />} />
          <Route path="/configuration" element={<Navigate to="/configuracion" replace />} />
          <Route path="/config-history" element={<Navigate to="/historial-configuracion" replace />} />
          <Route path="/history" element={<Navigate to="/mediciones" replace />} />

          <Route path="*" element={<Navigate to="/tablero" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
