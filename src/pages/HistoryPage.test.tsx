import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test-utils';
import { HistoryPage } from './HistoryPage';
import type { MeasurementResponse } from '../api/types';

const now = new Date().toISOString();

const measurements: MeasurementResponse[] = [
  { id: 'm1', temperature: 24.5, humidity: 50, coolerOn: false, relayOn: false, status: 'NORMAL', createdAt: now },
  { id: 'm2', temperature: 30.1, humidity: 70, coolerOn: true, relayOn: true, status: 'CRITICAL', createdAt: now },
];

const config = {
  id: 'c1', temperatureMin: 18, temperatureMax: 29, humidityMin: 31, humidityMax: 65,
  hysteresisTemperature: 1.5, hysteresisHumidity: 3, measurementIntervalSeconds: 30,
  createdByName: 'Sofía Martínez', createdByEmail: 'sofia@example.com', active: true, createdAt: now,
};

const measurementPage = { content: measurements, totalElements: 2, totalPages: 1, size: 20, number: 0 };
const emptyConfigPage = { content: [], totalElements: 0, totalPages: 0, size: 200, number: 0 };

const server = setupServer(
  http.get('*/api/measurements/latest', () => HttpResponse.json(measurements[0])),
  http.get('*/api/measurements', () => HttpResponse.json(measurementPage)),
  http.get('*/api/config/latest', () => HttpResponse.json(config)),
  http.get('*/api/config/history', () => HttpResponse.json(emptyConfigPage)),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('HistoryPage', () => {
  it('renders the heading and the two time-series charts', async () => {
    renderWithProviders(<HistoryPage />, { route: '/mediciones' });

    expect(await screen.findByRole('heading', { name: 'Mediciones' })).toBeInTheDocument();
    expect(await screen.findByText('Temperatura vs tiempo')).toBeInTheDocument();
    expect(await screen.findByText('Humedad vs tiempo')).toBeInTheDocument();
  });
});
