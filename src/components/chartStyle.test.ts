import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { axisMode, formatAxisDate } from './chartStyle';

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

describe('axisMode', () => {
  const MIN = 60_000;
  const DAY = 24 * 60 * MIN;

  it('uses seconds for spans up to 30 min', () => {
    expect(axisMode(10 * MIN)).toBe('seconds');
    expect(axisMode(30 * MIN)).toBe('seconds');
  });

  it('uses time of day for intraday spans up to a day', () => {
    expect(axisMode(2 * 60 * MIN)).toBe('time');
    expect(axisMode(DAY)).toBe('time');
  });

  it('uses dates for multi-day spans', () => {
    expect(axisMode(DAY + 1)).toBe('date');
    expect(axisMode(7 * DAY)).toBe('date');
  });
});
