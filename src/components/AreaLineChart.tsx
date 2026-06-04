import { useId, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { chartSx, formatAxisDate } from './chartStyle';

export interface ChartSeries {
  id: string;
  label: string;
  data: number[];
  color: string;
}

const NoLegend = () => null;

/**
 * Modern line chart: smooth/step curves, no axis chrome, subtle grid, optional gradient area,
 * and a custom clickable legend that shows/hides each line.
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

  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const visibleSeries = series.filter((s) => !hidden.has(s.id));

  const areaFillSx = area
    ? Object.fromEntries(visibleSeries.map((s) => [`& .MuiAreaElement-series-${s.id}`, { fill: `url(#${gradientId(s.id)})` }]))
    : {};

  return (
    <Box>
      {/* Custom clickable legend: tap an item to show/hide its line. */}
      <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={2} sx={{ mb: 1 }}>
        {series.map((s) => {
          const off = hidden.has(s.id);
          return (
            <Box key={s.id} role="button" tabIndex={0}
              onClick={() => toggle(s.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(s.id); } }}
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                userSelect: 'none', opacity: off ? 0.4 : 1,
              }}
            >
              <Box sx={{ width: 16, height: 4, borderRadius: 2, backgroundColor: s.color }} />
              <Typography variant="caption" sx={{ fontWeight: 600, textDecoration: off ? 'line-through' : 'none' }}>
                {s.label}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      <LineChart
        height={height}
        grid={{ horizontal: true }}
        margin={{ top: 8, right: 22, bottom: 24, left: 16 }}
        onAxisClick={onPointClick ? (_event, data) => { if (data) onPointClick(data.dataIndex); } : undefined}
        sx={[chartSx, areaFillSx, onPointClick ? { cursor: 'pointer' } : {}]}
        slots={{ legend: NoLegend }}
        slotProps={{ noDataOverlay: { message: 'No hay líneas seleccionadas' } }}
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
        series={visibleSeries.map((s) => ({
          id: s.id, label: s.label, data: s.data, color: s.color,
          showMark: false, curve, area,
        }))}
      >
        <defs>
          {visibleSeries.map((s) => (
            <linearGradient key={s.id} id={gradientId(s.id)} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
      </LineChart>
    </Box>
  );
}
