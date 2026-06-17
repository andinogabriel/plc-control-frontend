import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
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

  // Regression guard for the reported "el selector de Últimas lecturas no se refleja": switching
  // the range must drive a refetch AND show the result. Here the new window returns no rows, so the
  // chart must flip to its empty state — proving the select change is reflected in the UI.
  it('reflects a range change in the "Últimas lecturas" chart', async () => {
    localStorage.clear(); // start from the default 24h range
    const dataPage = {
      content: [
        latest,
        { ...latest, id: 'm2', createdAt: new Date(Date.now() - 3 * 3600_000).toISOString() },
      ],
      totalElements: 2, totalPages: 1, size: 1500, number: 0,
    };
    const emptyPage = { content: [], totalElements: 0, totalPages: 0, size: 1500, number: 0 };
    // Wide windows (>2h ago) have data; narrow ones (e.g. "Última hora") return nothing.
    server.use(
      http.get('*/api/measurements', ({ request }) => {
        const from = new URL(request.url).searchParams.get('from');
        const narrow = from != null && Date.now() - new Date(from).getTime() < 2 * 3600_000;
        return HttpResponse.json(narrow ? emptyPage : dataPage);
      }),
    );
    renderWithProviders(<DashboardPage />);

    // Default 24h window has data → no empty state yet.
    await screen.findByText('Estado del cooler');
    expect(screen.queryByText('Sin lecturas en este rango')).toBeNull();

    // Open the chart's range select (its value reads "Último día" for 24h) and pick a 1h window.
    const chartRangeSelect = screen.getAllByRole('combobox').find((c) => c.textContent === 'Último día');
    expect(chartRangeSelect).toBeDefined();
    fireEvent.mouseDown(chartRangeSelect!);
    fireEvent.click(await screen.findByRole('option', { name: 'Última hora' }));

    // The 1h window returns no rows → the chart must reflect it.
    expect(await screen.findByText('Sin lecturas en este rango')).toBeInTheDocument();
  });

  it('offers a "Ver último mes" shortcut from an empty range and applies it', async () => {
    localStorage.clear();
    const emptyPage = { content: [], totalElements: 0, totalPages: 0, size: 1500, number: 0 };
    server.use(http.get('*/api/measurements', () => HttpResponse.json(emptyPage)));
    renderWithProviders(<DashboardPage />);

    // No rows in the default windows → the empty state offers the shortcut.
    const buttons = await screen.findAllByRole('button', { name: 'Ver último mes' });
    expect(buttons.length).toBeGreaterThan(0);

    // Applying it jumps that panel's range to "Último mes".
    fireEvent.click(buttons[0]);
    expect(await screen.findByText('Último mes')).toBeInTheDocument();
  });
});
