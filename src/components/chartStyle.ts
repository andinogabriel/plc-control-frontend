import type { Theme } from '@mui/material';
import dayjs from 'dayjs';

/** Shared, modern styling for the LineCharts: no axis lines/ticks, subtle dashed grid,
 *  rounded line caps. Exported as a theme function so colors adapt to light/dark. */
export const chartSx = (theme: Theme) => ({
  '& .MuiChartsAxis-line': { display: 'none' },
  '& .MuiChartsAxis-tick': { display: 'none' },
  '& .MuiChartsAxis-tickLabel': { fontSize: 11, fill: theme.palette.text.secondary },
  '& .MuiChartsGrid-line': { stroke: theme.palette.divider, strokeDasharray: '4 6' },
  '& .MuiLineElement-root': { strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
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
