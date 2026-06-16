import { useEffect, useId, useState } from 'react';
import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { LineChart } from '@mui/x-charts/LineChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { chartSx, formatAxisDate } from './chartStyle';
import { ChartBrush } from './ChartBrush';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface ChartSeries {
  id: string;
  label: string;
  data: number[];
  color: string;
  /** Render as a dashed line with no area fill (used for comparison/overlay series). */
  dashed?: boolean;
}

export interface ReferenceMark {
  value: number;
  label?: string;
  color?: string;
}

export interface VerticalMarker {
  date: Date;
  label?: string;
  color?: string;
}

const NoLegend = () => null;

/**
 * Modern line chart: smooth/step curves, no axis chrome, subtle grid, optional gradient area,
 * a custom clickable legend, threshold reference lines, and optional zoom via a brush bar.
 */
export function AreaLineChart({
  labels, series, height, mode = 'date', area = true, curve = 'monotoneX', onPointClick, referenceLines, verticalMarkers, zoomable = false, xScale = 'time', showMarks = false,
}: {
  labels: Date[];
  series: ChartSeries[];
  height: number;
  mode?: 'date' | 'time';
  area?: boolean;
  curve?: 'monotoneX' | 'stepAfter' | 'linear' | 'natural';
  onPointClick?: (dataIndex: number) => void;
  referenceLines?: ReferenceMark[];
  verticalMarkers?: VerticalMarker[];
  zoomable?: boolean;
  /** 'time' spaces points by their timestamp (continuous series); 'point' spaces them evenly
   *  (discrete events like config versions, so every point stays individually clickable). */
  xScale?: 'time' | 'point';
  /** Render a dot at every data point. Useful for discrete series (e.g. config changes) where
   *  each point is meaningful and clickable; left off for dense continuous series. */
  showMarks?: boolean;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/[:]/g, '');
  const gradientId = (id: string) => `grad-${uid}-${id}`;

  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  // Zoom window as [0,1] fractions. Reset whenever the dataset size changes (e.g. range switch).
  const n = labels.length;
  const [zoom, setZoom] = useState({ s: 0, e: 1 });
  useEffect(() => { setZoom({ s: 0, e: 1 }); }, [n]);
  const canZoom = zoomable && n > 2;
  const zoomed = canZoom && (zoom.s > 0 || zoom.e < 1);

  const i0 = canZoom ? Math.min(n - 2, Math.max(0, Math.round(zoom.s * (n - 1)))) : 0;
  const i1 = canZoom ? Math.max(i0 + 1, Math.min(n - 1, Math.round(zoom.e * (n - 1)))) : n - 1;

  const viewLabels = canZoom ? labels.slice(i0, i1 + 1) : labels;
  const viewSeries = canZoom
    ? series.map((s) => ({ ...s, data: s.data.slice(i0, i1 + 1) }))
    : series;
  const visibleSeries = viewSeries.filter((s) => !hidden.has(s.id));

  const handlePointClick = onPointClick ? (idx: number) => onPointClick(i0 + idx) : undefined;

  // Per-series styling targets the v9 element classes by their `data-series-id` attribute.
  const areaFillSx = area
    ? Object.fromEntries(visibleSeries.filter((s) => !s.dashed).map((s) => [`& .MuiLineChart-area[data-series-id="${s.id}"]`, { fill: `url(#${gradientId(s.id)})`, fillOpacity: 1 }]))
    : {};
  const dashSx = Object.fromEntries(
    visibleSeries.filter((s) => s.dashed).map((s) => [`& .MuiLineChart-line[data-series-id="${s.id}"]`, { strokeDasharray: '6 5', strokeWidth: 2 }]),
  );

  return (
    <Box>
      {/* Custom clickable legend: tap an item to show/hide its line. */}
      <Stack direction="row" sx={{ justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1, position: 'relative' }}>
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
        {zoomed && (
          <Button size="small" startIcon={<RestartAltRoundedIcon />} onClick={() => setZoom({ s: 0, e: 1 })}
            sx={{ position: { sm: 'absolute' }, right: 0 }}>
            Restablecer zoom
          </Button>
        )}
      </Stack>

      <LineChart
        height={height}
        grid={{ horizontal: true }}
        skipAnimation={reducedMotion}
        margin={{ top: 8, right: 22, bottom: 24, left: 16 }}
        onAxisClick={handlePointClick ? (_event, data) => { if (data) handlePointClick(data.dataIndex); } : undefined}
        sx={[chartSx, areaFillSx, dashSx, handlePointClick ? { cursor: 'pointer' } : {}]}
        slots={{ legend: NoLegend }}
        localeText={{ noData: 'No hay líneas seleccionadas' }}
        xAxis={[{
          data: viewLabels,
          scaleType: xScale,
          disableLine: true,
          disableTicks: true,
          tickLabelStyle: { fontSize: 11 },
          valueFormatter: (value: Date, ctx?: { location?: string }) => formatAxisDate(value, ctx?.location, mode),
        }]}
        yAxis={[{
          disableLine: true,
          disableTicks: true,
          width: 44,
          tickLabelStyle: { fontSize: 11 },
        }]}
        series={visibleSeries.map((s) => ({
          id: s.id, label: s.label, data: s.data, color: s.color,
          showMark: showMarks && !s.dashed, curve, area: s.dashed ? false : area,
        }))}
      >
        {(referenceLines ?? []).map((ref, i) => (
          <ChartsReferenceLine
            key={`h-${ref.value}-${i}`}
            y={ref.value}
            label={ref.label}
            labelAlign="end"
            lineStyle={{ stroke: ref.color ?? theme.palette.text.disabled, strokeDasharray: '5 4', strokeWidth: 1.5 }}
            labelStyle={{ fontSize: 10, fill: ref.color ?? theme.palette.text.secondary }}
          />
        ))}
        {(verticalMarkers ?? []).map((m, i) => (
          <ChartsReferenceLine
            key={`v-${m.date.getTime()}-${i}`}
            x={m.date}
            label={m.label}
            labelAlign="start"
            lineStyle={{ stroke: m.color ?? theme.palette.info.main, strokeDasharray: '2 3', strokeWidth: 1.5 }}
            labelStyle={{ fontSize: 9, fill: m.color ?? theme.palette.info.main }}
          />
        ))}
        <defs>
          {visibleSeries.map((s) => (
            // Three-stop fade: a richer tint at the line that drops off quickly, so overlapping
            // series stay readable (the lower half is near-transparent) and the bottom blends
            // into the card. The fillOpacity override above lets this gradient show through.
            <linearGradient key={s.id} id={gradientId(s.id)} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
              <stop offset="55%" stopColor={s.color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
      </LineChart>

      {canZoom && (
        <ChartBrush series={series.filter((s) => !hidden.has(s.id))}
          start={zoom.s} end={zoom.e} onChange={(s, e) => setZoom({ s, e })} />
      )}
    </Box>
  );
}
