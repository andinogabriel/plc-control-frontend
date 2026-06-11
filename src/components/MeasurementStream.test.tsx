import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MeasurementStream } from './MeasurementStream';
import type { MeasurementResponse } from '../api/types';

/** Minimal stand-in for the browser EventSource (jsdom does not implement it). */
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  closed = false;
  private listeners: Record<string, ((e: MessageEvent) => void)[]> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: (e: MessageEvent) => void) {
    (this.listeners[type] ??= []).push(cb);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: string) {
    (this.listeners[type] ?? []).forEach((cb) => cb({ data } as MessageEvent));
  }
}

const measurement: MeasurementResponse = {
  id: 'm1', temperature: 22, humidity: 48, coolerOn: false, relayOn: false, status: 'NORMAL',
  createdAt: '2026-06-11T10:00:00Z',
};

function renderStream() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MeasurementStream />
    </QueryClientProvider>,
  );
  return { queryClient, ...view };
}

describe('MeasurementStream', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens a single SSE connection to the stream endpoint', () => {
    renderStream();
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toMatch(/\/api\/measurements\/stream$/);
  });

  it('pushes an incoming measurement into the query cache', () => {
    const { queryClient } = renderStream();
    act(() => MockEventSource.instances[0].emit('measurement', JSON.stringify(measurement)));
    expect(queryClient.getQueryData(['measurement-latest'])).toEqual(measurement);
  });

  it('ignores a malformed event without throwing or touching the cache', () => {
    const { queryClient } = renderStream();
    expect(() =>
      act(() => MockEventSource.instances[0].emit('measurement', '{ not json')),
    ).not.toThrow();
    expect(queryClient.getQueryData(['measurement-latest'])).toBeUndefined();
  });

  it('closes the connection on unmount so a remount reconnects cleanly', () => {
    const { unmount } = renderStream();
    const source = MockEventSource.instances[0];
    unmount();
    expect(source.closed).toBe(true);
  });
});
