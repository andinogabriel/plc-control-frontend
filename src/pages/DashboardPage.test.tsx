import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test-utils';
import { DashboardPage } from './DashboardPage';
import type { MeasurementResponse } from '../api/types';

const now = new Date().toISOString();

const latest: MeasurementResponse = {
  id: 'm1', temperature: 24.5, humidity: 50, coolerOn: false, relayOn: false, status: 'NORMAL', createdAt: now,
};

const config = {
  id: 'c1', temperatureMin: 18, temperatureMax: 29, humidityMin: 31, humidityMax: 65,
  hysteresisTemperature: 1.5, hysteresisHumidity: 3, measurementIntervalSeconds: 30,
  createdByName: 'Sofía Martínez', createdByEmail: 'sofia@example.com', active: true, createdAt: now,
};

const page = {
  content: [latest], totalElements: 1, totalPages: 1, size: 20, number: 0,
};

const server = setupServer(
  http.get('*/api/measurements/latest', () => HttpResponse.json(latest)),
  http.get('*/api/measurements', () => HttpResponse.json(page)),
  http.get('*/api/config/latest', () => HttpResponse.json(config)),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('DashboardPage', () => {
  it('renders the live metrics from the API without crashing', async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    // Cards that only appear once the latest measurement has loaded.
    expect(await screen.findByText('Estado del cooler')).toBeInTheDocument();
    expect(await screen.findByText('APAGADO')).toBeInTheDocument();
  });

  it('shows the empty state when there is no measurement yet', async () => {
    server.use(
      http.get('*/api/measurements/latest', () => new HttpResponse(null, { status: 404 })),
    );
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Todavía no hay mediciones')).toBeInTheDocument();
  });
});
