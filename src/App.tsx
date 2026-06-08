import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, GlobalStyles } from '@mui/material';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ServiceWorkerUpdater } from './components/ServiceWorkerUpdater';

// Route-level code splitting: each page is its own chunk, loaded on demand.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage').then((m) => ({ default: m.ConfigurationPage })));
const ConfigHistoryPage = lazy(() => import('./pages/ConfigHistoryPage').then((m) => ({ default: m.ConfigHistoryPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const KioscoPage = lazy(() => import('./pages/KioscoPage').then((m) => ({ default: m.KioscoPage })));

// Print/PDF: drop the chrome (AppBar, sidebar, bottom nav, action buttons) and let the
// dashboard content flow on a white page.
const printStyles = (
  <GlobalStyles styles={{
    '@media print': {
      '.MuiAppBar-root, .MuiDrawer-root, nav, .no-print': { display: 'none !important' },
      'main#main-content': { padding: '0 !important' },
      body: { backgroundColor: '#fff' },
    },
  }} />
);

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );
}

/** Shell layout for the regular app routes (the kiosk route renders without it). */
function LayoutRoute() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <>
      {printStyles}
      <ServiceWorkerUpdater />
      <ErrorBoundary>
        <Routes>
          {/* Full-screen live monitor: no app chrome. */}
          <Route path="/kiosco" element={<Suspense fallback={<PageFallback />}><KioscoPage /></Suspense>} />

          <Route element={<LayoutRoute />}>
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
          </Route>
        </Routes>
      </ErrorBoundary>
    </>
  );
}
