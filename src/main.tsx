import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { AppThemeProvider } from './colorMode';
import { ToastProvider } from './components/toast';
import { AlertsProvider } from './alerts';
import App from './App';

// Global Spanish locale so dayjs formatting (chart axis labels, etc.) is in Spanish.
dayjs.locale('es');

// The service worker is registered (production only) by <ServiceWorkerUpdater/>, which also
// surfaces an "update available" prompt.

const queryClient = new QueryClient({
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
