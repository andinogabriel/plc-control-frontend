import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { measurementApi } from '../api/measurementApi';
import { configApi } from '../api/configApi';
import { useSystemHealth } from './useSystemHealth';

vi.mock('../api/measurementApi', () => ({ measurementApi: { getLatest: vi.fn() } }));
vi.mock('../api/configApi', () => ({ configApi: { getLatest: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function secondsAgo(seconds: number) {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

const config = { measurementIntervalSeconds: 30 };

function measurement(createdAt: string) {
  return { id: 'm', temperature: 22, humidity: 50, coolerOn: false, relayOn: false, status: 'NORMAL', createdAt };
}

describe('useSystemHealth', () => {
  beforeEach(() => {
    vi.mocked(configApi.getLatest).mockResolvedValue(config as never);
  });

  it('reports "online" when the last reading is within 2x the interval', async () => {
    vi.mocked(measurementApi.getLatest).mockResolvedValue(measurement(secondsAgo(10)) as never);
    const { result } = renderHook(() => useSystemHealth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('online'));
  });

  it('reports "delayed" between 2x and 6x the interval', async () => {
    vi.mocked(measurementApi.getLatest).mockResolvedValue(measurement(secondsAgo(100)) as never);
    const { result } = renderHook(() => useSystemHealth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('delayed'));
  });

  it('reports "offline" beyond 6x the interval', async () => {
    vi.mocked(measurementApi.getLatest).mockResolvedValue(measurement(secondsAgo(300)) as never);
    const { result } = renderHook(() => useSystemHealth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('offline'));
  });

  it('reports "unknown" when there is no measurement', async () => {
    vi.mocked(measurementApi.getLatest).mockRejectedValue(new Error('404'));
    const { result } = renderHook(() => useSystemHealth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unknown'));
    expect(result.current.lastAt).toBeNull();
  });
});
