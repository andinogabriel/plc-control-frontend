import { describe, it, expect } from 'vitest';
import { deriveEvents } from './EventLog';
import type { MeasurementResponse } from '../api/types';

function m(over: Partial<MeasurementResponse> & { createdAt: string }): MeasurementResponse {
  return {
    id: over.createdAt,
    temperature: 20,
    humidity: 50,
    coolerOn: false,
    relayOn: false,
    status: 'NORMAL',
    ...over,
  } as MeasurementResponse;
}

describe('deriveEvents', () => {
  it('emits an ackable alarm when the status enters an out-of-range state', () => {
    const events = deriveEvents([
      m({ createdAt: '2026-06-01T10:00:00Z', status: 'NORMAL' }),
      m({ createdAt: '2026-06-01T10:01:00Z', status: 'WARNING_TEMP' }),
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ severity: 'warning', tag: 'TT-01', ackable: true });
  });

  it('emits a non-ackable success event when returning to normal', () => {
    const events = deriveEvents([
      m({ createdAt: '2026-06-01T10:00:00Z', status: 'WARNING_HUMIDITY' }),
      m({ createdAt: '2026-06-01T10:01:00Z', status: 'NORMAL' }),
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ severity: 'success', ackable: false });
  });

  it('emits an info event (not ackable) on a cooler toggle', () => {
    const events = deriveEvents([
      m({ createdAt: '2026-06-01T10:00:00Z', coolerOn: false }),
      m({ createdAt: '2026-06-01T10:01:00Z', coolerOn: true }),
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ severity: 'info', tag: 'FAN-01', ackable: false });
  });

  it('returns events newest-first and ignores the first sample (no prior state)', () => {
    const events = deriveEvents([
      m({ createdAt: '2026-06-01T10:00:00Z', status: 'WARNING_TEMP' }),
      m({ createdAt: '2026-06-01T10:01:00Z', status: 'NORMAL' }),
      m({ createdAt: '2026-06-01T10:02:00Z', status: 'CRITICAL' }),
    ]);
    // Transitions: ->NORMAL (success) then ->CRITICAL (error). Newest first => CRITICAL leads.
    expect(events.map((e) => e.severity)).toEqual(['error', 'success']);
  });
});
