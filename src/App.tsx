import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, GlobalStyles, Typography } from '@mui/material';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ServiceWorkerUpdater } from './components/ServiceWorkerUpdater';
import { NotFoundPage } from './pages/NotFoundPage';
import { MONO_FONT } from './theme';

// Route-level code splitting: each page is its own chunk, loaded on demand.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage').then((m) => ({ default: m.ConfigurationPage })));
const ConfigHistoryPage = lazy(() => import('./pages/ConfigHistoryPage').then((m) => ({ default: m.ConfigHistoryPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const KioscoPage = lazy(() => import('./pages/KioscoPage').then((m) => ({ default: m.KioscoPage })));

// Print/PDF. The print layout is driven by a `print-mode` class toggled on <body> just before
// printing (so it can also be measured/previewed on screen, unlike `@media print`): it drops the
// app chrome (AppBar, sidebar, bottom nav, action buttons, zoom brush), forces the metric cards
// into a single row, reveals `.print-only` elements (the dated stamp) and lets the dashboard be
// scaled with `zoom` to fill exactly one landscape page. `@media print` repeats the chrome-hiding
// as a fallback, and `@page` removes the browser's URL/date header (margin:0).
const printRules = {
  '.MuiAppBar-root, .MuiDrawer-root, nav, .no-print, .chart-brush': { display: 'none !important' },
  '#main-content > .MuiToolbar-root': { display: 'none !important' },
  '.print-only': { display: 'block !important' },
  '#main-content': { padding: '8mm !important' },
  '.MuiCard-root': { boxShadow: 'none !important', breakInside: 'avoid' },
  '.MuiCardContent-root': { minHeight: '0 !important' },
};

const printStyles = (
  <GlobalStyles styles={{
    '.print-only': { display: 'none' },
    '@page': { size: 'A4 portrait', margin: 0 },
    'body.print-mode': { backgroundColor: '#fff', ...printRules },
    '@media print': { 'html, body': { backgroundColor: '#fff' }, ...printRules },
  }} />
);

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mt: 8, color: 'text.secondary' }}>
      <CircularProgress size={20} thickness={5} />
      <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 13, letterSpacing: '0.04em' }}>
        Cargando módulo…
      </Typography>
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

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </>
  );
}
