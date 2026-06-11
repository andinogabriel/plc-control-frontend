import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { ToastProvider } from '../components/toast';
import { ConfigurationPage } from './ConfigurationPage';

const activeConfig = {
  id: '1',
  temperatureMin: 18,
  temperatureMax: 29,
  humidityMin: 31,
  humidityMax: 65,
  hysteresisTemperature: 1.5,
  hysteresisHumidity: 3,
  measurementIntervalSeconds: 30,
  createdByName: 'Sofía Martínez',
  createdByEmail: 'sofia@example.com',
  active: true,
  createdAt: '2026-06-01T10:00:00Z',
};

const server = setupServer(
  http.get('*/api/config/latest', () => HttpResponse.json(activeConfig)),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('ConfigurationPage', () => {
  it('shows the active configuration banner from the API', async () => {
    render(<ConfigurationPage />, { wrapper });

    expect(await screen.findByText(/Config activa/)).toBeInTheDocument();
    expect(await screen.findByText(/Sofía Martínez/)).toBeInTheDocument();
  });

  it('renders the threshold fields', () => {
    render(<ConfigurationPage />, { wrapper });
    expect(screen.getByText('Umbrales')).toBeInTheDocument();
    expect(screen.getByText('Guardar configuración')).toBeInTheDocument();
  });
});
