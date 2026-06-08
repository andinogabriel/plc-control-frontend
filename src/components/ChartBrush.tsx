import { useRef, type PointerEvent } from 'react';
import { Box, useTheme } from '@mui/material';
import type { ChartSeries } from './AreaLineChart';

type DragMode = 'left' | 'right' | 'pan' | 'new' | null;
const HANDLE_HIT = 0.035;
const MIN_WIDTH = 0.03;

/**
 * Overview/brush bar for zooming a chart: shows a miniature of the series and a draggable
 * selection window (drag the handles to resize, the body to pan, or an empty area to start a
 * new selection). Reports the window as start/end fractions in [0,1].
 */
export function ChartBrush({ series, start, end, onChange, height = 40 }: {
  series: ChartSeries[];
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  height?: number;
}) {
  const theme = useTheme();
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: DragMode; anchor: number; origS: number; origE: number; startFrac: number }>({
    mode: null, anchor: 0, origS: 0, origE: 1, startFrac: 0,
  });

  const all = series.flatMap((s) => s.data);
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 1;
  const range = max - min || 1;
  const points = (data: number[]) => data
    .map((v, i) => `${(i / Math.max(1, data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(' ');

  const fracFrom = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const f = fracFrom(e.clientX);
    let mode: DragMode;
    if (Math.abs(f - start) <= HANDLE_HIT) mode = 'left';
    else if (Math.abs(f - end) <= HANDLE_HIT) mode = 'right';
    else if (f > start && f < end) mode = 'pan';
    else { mode = 'new'; onChange(f, Math.min(1, f + MIN_WIDTH)); }
    drag.current = { mode, anchor: f, origS: start, origE: end, startFrac: f };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.mode) return;
    const f = fracFrom(e.clientX);
    if (d.mode === 'left') onChange(Math.min(f, end - MIN_WIDTH), end);
    else if (d.mode === 'right') onChange(start, Math.max(f, start + MIN_WIDTH));
    else if (d.mode === 'new') onChange(Math.min(d.anchor, f), Math.max(d.anchor, f));
    else if (d.mode === 'pan') {
      const width = d.origE - d.origS;
      const ns = Math.min(Math.max(d.origS + (f - d.startFrac), 0), 1 - width);
      onChange(ns, ns + width);
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    drag.current.mode = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const sel = { left: `${start * 100}%`, width: `${(end - start) * 100}%` };

  return (
    <Box
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      sx={{
        position: 'relative', height, mt: 1, borderRadius: 1, overflow: 'hidden',
        bgcolor: 'action.hover', cursor: 'crosshair', touchAction: 'none', userSelect: 'none',
      }}
    >
      <Box component="svg" viewBox="0 0 100 100" preserveAspectRatio="none"
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {series.map((s) => (
          <polyline key={s.id} points={points(s.data)} fill="none" stroke={s.color}
            strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.6} />
        ))}
      </Box>

      {/* Dimmed regions outside the selection */}
      <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${start * 100}%`, bgcolor: 'rgba(0,0,0,0.35)' }} />
      <Box sx={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${(1 - end) * 100}%`, bgcolor: 'rgba(0,0,0,0.35)' }} />

      {/* Selection window + handles */}
      <Box sx={{
        position: 'absolute', top: 0, bottom: 0, left: sel.left, width: sel.width,
        border: `1px solid ${theme.palette.primary.main}`, boxSizing: 'border-box',
        bgcolor: `${theme.palette.primary.main}14`, cursor: 'grab',
      }}>
        <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: -3, width: 6, cursor: 'ew-resize', bgcolor: 'primary.main', borderRadius: 1 }} />
        <Box sx={{ position: 'absolute', top: 0, bottom: 0, right: -3, width: 6, cursor: 'ew-resize', bgcolor: 'primary.main', borderRadius: 1 }} />
      </Box>
    </Box>
  );
}
