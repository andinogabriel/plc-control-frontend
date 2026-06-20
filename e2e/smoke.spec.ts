import { test, expect } from '@playwright/test';

// The exact path a presenter walks in the defence. The API is mocked so the run is deterministic
// and needs no backend; it is the insurance that the whole flow renders and works before going live.

const now = new Date().toISOString();

const config = {
  id: 'c1', temperatureMin: 18, temperatureMax: 29, humidityMin: 31, humidityMax: 65,
  hysteresisTemperature: 1.5, hysteresisHumidity: 3, measurementIntervalSeconds: 30,
  createdByName: 'Sofía Martínez', createdByEmail: 'sofia@example.com', active: true, createdAt: now,
};
const measurement = {
  id: 'm1', temperature: 24.5, humidity: 50, coolerOn: false, relayOn: false, status: 'NORMAL', createdAt: now,
};
const measurementPage = { content: [measurement], totalElements: 1, totalPages: 1, size: 20, number: 0 };
const configHistory = { content: [config], totalElements: 1, totalPages: 1, size: 200, number: 0 };

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes('/api/measurements/stream')) return route.abort();
    if (url.includes('/api/measurements/latest')) return route.fulfill({ json: measurement });
    if (url.includes('/api/measurements')) return route.fulfill({ json: measurementPage });
    if (url.includes('/api/events/unacknowledged-count')) return route.fulfill({ json: { unacknowledged: 0 } });
    if (url.includes('/api/events')) return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, size: 12, number: 0 } });
    if (url.includes('/api/config/latest')) return route.fulfill({ json: config });
    if (url.includes('/api/config/history')) return route.fulfill({ json: configHistory });
    if (url.includes('/api/config') && method === 'POST') return route.fulfill({ status: 201, json: config });
    return route.fulfill({ json: {} });
  });
});

test('demo flow: dashboard -> save config -> kiosco', async ({ page }) => {
  // Dashboard renders with live metrics.
  await page.goto('/tablero');
  await expect(page.getByRole('heading', { name: 'Monitoreo en tiempo real' })).toBeVisible();
  await expect(page.getByText('Estado del cooler')).toBeVisible();

  // Configuration: load the active config and save.
  await page.getByRole('link', { name: 'Configuración' }).click();
  await expect(page.getByText('Configuración de umbrales')).toBeVisible();
  await page.getByRole('button', { name: 'Cargar config activa' }).click();
  await page.getByRole('button', { name: 'Guardar configuración' }).click();
  await expect(page.getByText('Configuración guardada correctamente')).toBeVisible();

  // Kiosk (the screen shown live).
  await page.goto('/kiosco');
  await expect(page.getByText('Monitor en vivo')).toBeVisible();
});
