import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { AppThemeProvider } from './colorMode';
import { ToastProvider, notifyToast } from './components/toast';
import { AlertsProvider } from './alerts';
import App from './App';

// Global Spanish locale so dayjs formatting (chart axis labels, etc.) is in Spanish.
dayjs.locale('es');

// The service worker is registered (production only) by <ServiceWorkerUpdater/>, which also
// surfaces an "update available" prompt.

// Surface server errors (5xx) as a single throttled toast, so a backend outage is obvious even
// when several queries fail at once. Expected 404s (no config / no measurements yet) are ignored.
let lastErrorToast = 0;
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const status = (error as AxiosError)?.response?.status;
      const now = Date.now();
      if (status && status >= 500 && now - lastErrorToast > 4000) {
        lastErrorToast = now;
        notifyToast('El servidor tuvo un problema (500). Reintentando…', 'error');
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <ToastProvider>
          <AlertsProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </LocalizationProvider>
          </AlertsProvider>
        </ToastProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
