import { useId } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { chartSx, formatAxisDate } from './chartStyle';

export interface ChartSeries {
  id: string;
  label: string;
  data: number[];
  color: string;
}

/**
 * Modern line chart used across the app: smooth/step curves, no axis chrome, subtle grid,
 * and an optional gradient area that fades to transparent under each line (2026 dashboard look).
 */
export function AreaLineChart({
  labels, series, height, mode = 'date', area = true, curve = 'monotoneX', onPointClick,
}: {
  labels: Date[];
  series: ChartSeries[];
  height: number;
  mode?: 'date' | 'time';
  area?: boolean;
  curve?: 'monotoneX' | 'stepAfter' | 'linear' | 'natural';
  onPointClick?: (dataIndex: number) => void;
}) {
  const uid = useId().replace(/[:]/g, '');
  const gradientId = (id: string) => `grad-${uid}-${id}`;

  const areaFillSx = area
    ? Object.fromEntries(series.map((s) => [`& .MuiAreaElement-series-${s.id}`, { fill: `url(#${gradientId(s.id)})` }]))
    : {};

  return (
    <LineChart
      height={height}
      grid={{ horizontal: true }}
      margin={{ top: 12, right: 22, bottom: 24, left: 16 }}
      onAxisClick={onPointClick ? (_event, data) => { if (data) onPointClick(data.dataIndex); } : undefined}
      sx={[chartSx, areaFillSx, onPointClick ? { cursor: 'pointer' } : {}]}
      slotProps={{ legend: { sx: { fontSize: 12, fontWeight: 600 } } }}
      xAxis={[{
        data: labels,
        scaleType: 'time',
        disableLine: true,
        disableTicks: true,
        tickLabelStyle: { fontSize: 11 },
        valueFormatter: (value, ctx) => formatAxisDate(value as Date, ctx?.location, mode),
      }]}
      yAxis={[{
        disableLine: true,
        disableTicks: true,
        width: 44,
        tickLabelStyle: { fontSize: 11 },
      }]}
      series={series.map((s) => ({
        id: s.id, label: s.label, data: s.data, color: s.color,
        showMark: false, curve, area,
      }))}
    >
      <defs>
        {series.map((s) => (
          <linearGradient key={s.id} id={gradientId(s.id)} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={s.color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
    </LineChart>
  );
}
