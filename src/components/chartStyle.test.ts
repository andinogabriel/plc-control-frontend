import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { formatAxisDate } from './chartStyle';

dayjs.locale('es');

describe('formatAxisDate', () => {
  const date = new Date('2026-06-03T17:30:00');

  it('formats intraday ticks as HH:mm', () => {
    expect(formatAxisDate(date, 'tick', 'time')).toBe('17:30');
  });

  it('formats short-range ticks with seconds (HH:mm:ss)', () => {
    expect(formatAxisDate(new Date('2026-06-03T17:30:04'), 'tick', 'seconds')).toBe('17:30:04');
  });

  it('includes seconds on intraday tooltips so close samples are distinguishable', () => {
    expect(formatAxisDate(new Date('2026-06-03T17:30:04'), 'tooltip', 'seconds')).toBe('3 jun 17:30:04');
    expect(formatAxisDate(date, 'tooltip', 'time')).toBe('3 jun 17:30:00');
  });

  it('formats date ticks as day + month (Spanish)', () => {
    expect(formatAxisDate(date, 'tick', 'date')).toBe('3 jun');
  });

  it('uses a full date/time on the tooltip', () => {
    expect(formatAxisDate(date, 'tooltip', 'date')).toContain('2026');
    expect(formatAxisDate(date, 'tooltip', 'date')).toContain('17:30');
  });
});
