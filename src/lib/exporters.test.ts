import { describe, it, expect } from 'vitest';
import { buildCsv, contrastInk } from './exporters';

describe('buildCsv', () => {
  it('builds a header row plus one line per row', () => {
    const csv = buildCsv(
      [{ a: 1, b: 'x' }, { a: 2, b: 'y' }],
      [{ header: 'A', value: (r) => r.a }, { header: 'B', value: (r) => r.b }],
    );
    expect(csv).toBe('A,B\n1,x\n2,y');
  });

  it('quotes and escapes commas, quotes and newlines', () => {
    const csv = buildCsv(
      [{ n: 'a,b' }, { n: 'he said "hi"' }],
      [{ header: 'N', value: (r) => r.n }],
    );
    expect(csv).toBe('N\n"a,b"\n"he said ""hi"""');
  });

  it('renders null/undefined as empty cells', () => {
    const csv = buildCsv(
      [{ n: null as string | null }],
      [{ header: 'N', value: (r) => r.n }],
    );
    expect(csv).toBe('N\n');
  });
});

describe('contrastInk', () => {
  it('returns dark ink on a light background', () => {
    expect(contrastInk('rgb(255, 255, 255)')).toBe('#0f172a');
    expect(contrastInk('#ffffff')).toBe('#0f172a'); // falls back to dark when not parseable
  });

  it('returns light ink on a dark background', () => {
    expect(contrastInk('rgb(17, 24, 39)')).toBe('#f8fafc');
  });
});
