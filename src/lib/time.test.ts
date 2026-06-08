import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelative } from './time';

describe('formatRelative', () => {
  beforeEach(() => { vi.useFakeTimers().setSystemTime(new Date('2026-06-07T12:00:00')); });
  afterEach(() => { vi.useRealTimers(); });

  it('shows "hace un momento" under 10 s', () => {
    expect(formatRelative(new Date('2026-06-07T11:59:55'))).toBe('hace un momento');
  });

  it('shows seconds', () => {
    expect(formatRelative(new Date('2026-06-07T11:59:30'))).toBe('hace 30 s');
  });

  it('shows minutes', () => {
    expect(formatRelative(new Date('2026-06-07T11:30:00'))).toBe('hace 30 min');
  });

  it('shows hours', () => {
    expect(formatRelative(new Date('2026-06-07T09:00:00'))).toBe('hace 3 h');
  });

  it('shows days', () => {
    expect(formatRelative(new Date('2026-06-04T12:00:00'))).toBe('hace 3 d');
  });
});
