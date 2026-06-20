import type { Theme } from '@mui/material';
import dayjs from 'dayjs';
import { MONO_FONT } from '../theme';

/** Shared, modern styling for the LineCharts: no axis lines/ticks, subtle dashed grid,
 *  rounded line caps, monospaced axis labels (telemetry readout feel). Exported as a theme
 *  function so colors adapt to light/dark. */
export const chartSx = (theme: Theme) => ({
  '& .MuiChartsAxis-line': { display: 'none' },
  '& .MuiChartsAxis-tick': { display: 'none' },
  '& .MuiChartsAxis-tickLabel': { fontSize: 11, fontFamily: MONO_FONT, fill: theme.palette.text.secondary },
  '& .MuiChartsGrid-line': {
    stroke: theme.palette.divider,
    strokeDasharray: '4 6',
    // Grid lines need slightly more presence on dark backgrounds to stay legible.
    strokeOpacity: theme.palette.mode === 'dark' ? 0.7 : 1,
  },
  // MUI X v9 renamed the line/area element classes (the old `MuiLineElement-root` /
  // `MuiAreaElement-*` no longer exist) — series elements now carry `MuiLineChart-line` /
  // `MuiLineChart-area` plus a `data-series-id` attribute for per-series targeting.
  '& .MuiLineChart-line': { strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
  // Marks (shown for discrete series like config changes): the default mark is a filled d3
  // symbol path, so size comes from the series; we just add a paper-colored ring so each node
  // reads as a distinct, clickable point sitting on top of the line.
  '& .MuiLineChart-mark': {
    strokeWidth: 2,
    stroke: theme.palette.background.paper,
  },
  // Dashed crosshair shown while hovering, so a reading is easy to line up with its axis.
  '& .MuiChartsAxisHighlight-root': {
    stroke: theme.palette.text.disabled,
    strokeDasharray: '3 3',
    strokeWidth: 1,
  },
});

/**
 * Spanish date/time formatter for chart axes. Ticks are concise; tooltips show the full date.
 * @param mode 'date' for multi-day ranges (e.g. "3 jun"), 'time' for intraday (e.g. "17:30").
 */
export function formatAxisDate(
  value: Date,
  location: 'tick' | 'tooltip' | string | undefined,
  mode: 'date' | 'time',
): string {
  const d = dayjs(value);
  if (location === 'tooltip') return d.format('D MMM YYYY HH:mm');
  return mode === 'time' ? d.format('HH:mm') : d.format('D MMM');
}
