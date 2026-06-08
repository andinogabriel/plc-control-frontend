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

// Print/PDF: landscape page with no browser header/footer (margin:0 hides the URL/date that
// Chrome injects), drop the app chrome and the action buttons, hide the chart's zoom brush, and
// scale the content so the dashboard fits on a single page. `.print-only` elements (e.g. the
// "Actualizado: <fecha>" stamp) appear only on paper.
const printStyles = (
  <GlobalStyles styles={{
    '.print-only': { display: 'none' },
    '@page': { size: 'A4 portrait', margin: 0 },
    '@media print': {
      'html, body': { backgroundColor: '#fff' },
      '.MuiAppBar-root, .MuiDrawer-root, nav, .no-print, .chart-brush': { display: 'none !important' },
      // The fixed Toolbar spacer is only needed to clear the (now hidden) AppBar.
      'main#main-content > .MuiToolbar-root': { display: 'none !important' },
      '.print-only': { display: 'block !important' },
      // Padding for the page edges; the one-page scale is applied via inline `zoom` at print time.
      'main#main-content': { padding: '10mm !important' },
      '.MuiCard-root': { boxShadow: 'none !important', breakInside: 'avoid' },
      '.MuiCardContent-root': { minHeight: '0 !important' },
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
