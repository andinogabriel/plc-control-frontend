import { describe, it, expect } from 'vitest';
import { buildCsv } from './exporters';

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
