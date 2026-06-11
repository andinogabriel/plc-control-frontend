import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AppThemeProvider } from './colorMode';
import { ToastProvider } from './components/toast';

/**
 * Renders a page/component inside the same provider tree as the app (theme, toast, date-picker
 * localization, router and a per-test QueryClient with retries off). Used by the page render
 * tests, where the components reach for routing, theming and data-fetching context.
 */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <ToastProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </LocalizationProvider>
          </ToastProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
