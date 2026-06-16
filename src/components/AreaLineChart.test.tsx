import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AreaLineChart, type ChartSeries } from './AreaLineChart';

// MUI X v9 renamed the line/area element classes and now exposes a `data-series-id` attribute
// per element. These tests lock in the v9 selectors the component relies on for its gradient
// fills, dashed overlays and marks — if a future MUI X bump renames them again, the area fill
// silently breaks (areas render solid and overlap), so we want a red test, not a visual regression.
const labels = [0, 1, 2, 3].map((h) => new Date(2026, 5, 1, h));
const series: ChartSeries[] = [
  { id: 'temp', label: 'Temperatura', data: [20, 22, 24, 23], color: '#3b82f6' },
  { id: 'hum', label: 'Humedad', data: [40, 50, 60, 55], color: '#14b8a6' },
];

describe('AreaLineChart (MUI X v9 element wiring)', () => {
  it('renders a gradient-filled area element per series, targetable by data-series-id', () => {
    const { container } = render(<AreaLineChart height={200} labels={labels} series={series} />);

    for (const s of series) {
      const area = container.querySelector(`.MuiLineChart-area[data-series-id="${s.id}"]`);
      expect(area, `area element for "${s.id}"`).not.toBeNull();
      // The gradient referenced by the fill override must be defined in the SVG.
      const gradient = container.querySelector(`linearGradient[id$="-${s.id}"]`);
      expect(gradient, `gradient def for "${s.id}"`).not.toBeNull();
    }
  });

  it('renders a line element per series, targetable by data-series-id', () => {
    const { container } = render(<AreaLineChart height={200} labels={labels} series={series} />);
    for (const s of series) {
      expect(container.querySelector(`.MuiLineChart-line[data-series-id="${s.id}"]`)).not.toBeNull();
    }
  });

  it('omits area elements when area is disabled', () => {
    const { container } = render(<AreaLineChart height={200} area={false} labels={labels} series={series} />);
    expect(container.querySelector('.MuiLineChart-area')).toBeNull();
    expect(container.querySelector('.MuiLineChart-line[data-series-id="temp"]')).not.toBeNull();
  });

  it('renders marks only when showMarks is set', () => {
    const { container: without } = render(<AreaLineChart height={200} labels={labels} series={series} />);
    expect(without.querySelector('.MuiLineChart-mark')).toBeNull();

    const { container: withMarks } = render(<AreaLineChart height={200} showMarks labels={labels} series={series} />);
    expect(withMarks.querySelector('.MuiLineChart-mark')).not.toBeNull();
  });

  it('keeps a dashed overlay series as a line without an area fill', () => {
    const dashed: ChartSeries[] = [
      { id: 'now', label: 'Actual', data: [20, 22, 24, 23], color: '#3b82f6' },
      { id: 'prev', label: 'Previo', data: [18, 19, 21, 20], color: '#94a3b8', dashed: true },
    ];
    const { container } = render(<AreaLineChart height={200} labels={labels} series={dashed} />);
    expect(container.querySelector('.MuiLineChart-line[data-series-id="prev"]')).not.toBeNull();
    // The dashed comparison series must not get an area fill.
    expect(container.querySelector('.MuiLineChart-area[data-series-id="prev"]')).toBeNull();
    expect(container.querySelector('.MuiLineChart-area[data-series-id="now"]')).not.toBeNull();
  });
});
