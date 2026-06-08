import { describe, it, expect } from 'vitest';
import { formatNumber, formatTemp, formatPct } from './format';

describe('format (es-AR)', () => {
  it('formats one decimal with a comma', () => {
    expect(formatNumber(20.7)).toBe('20,7');
    expect(formatNumber(20)).toBe('20,0');
  });

  it('uses a dot as thousands separator', () => {
    expect(formatNumber(1234.5)).toBe('1.234,5');
  });

  it('appends the temperature unit', () => {
    expect(formatTemp(21.4)).toBe('21,4 °C');
  });

  it('appends the percentage unit', () => {
    expect(formatPct(38.2)).toBe('38,2 %');
  });
});
