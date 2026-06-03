import type { SxProps, Theme } from '@mui/material';
import dayjs from 'dayjs';

/** Shared, modern styling for the LineCharts: no axis lines/ticks, subtle dashed grid. */
export const chartSx: SxProps<Theme> = (theme) => ({
  '& .MuiChartsAxis-line': { display: 'none' },
  '& .MuiChartsAxis-tick': { display: 'none' },
  '& .MuiChartsAxis-tickLabel': { fontSize: 11, fill: theme.palette.text.secondary },
  '& .MuiChartsGrid-line': { stroke: 'rgba(128,128,128,0.18)', strokeDasharray: '4 4' },
  '& .MuiLineElement-root': { strokeWidth: 2.5 },
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
