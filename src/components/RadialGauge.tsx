import { Box, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatNumber } from '../lib/format';

const TAU = Math.PI / 180;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const pt = (cx: number, cy: number, r: number, deg: number): [number, number] =>
  [cx + r * Math.cos(deg * TAU), cy - r * Math.sin(deg * TAU)];

/**
 * Semicircular gauge that places the current reading within the configured min–max band, with
 * the upper hysteresis zone shaded. Green inside the band, red when out of range. Used on the
 * dashboard so you can see at a glance "how close to the limit" temperature/humidity are.
 */
export function RadialGauge({ value, min, max, hysteresis = 0, unit, showValue = false }: {
  value: number;
  min: number;
  max: number;
  hysteresis?: number;
  unit: string;
  showValue?: boolean;
}) {
  const theme = useTheme();
  const cx = 60;
  const cy = 58;
  const r = 46;

  // Scale a bit wider than the band so out-of-range values are visible.
  const pad = Math.max(1, (max - min) * 0.3);
  const scaleMin = min - pad;
  const scaleMax = max + pad;

  const angleOf = (v: number) => 180 - clamp01((v - scaleMin) / (scaleMax - scaleMin)) * 180;
  const arc = (a: number, b: number) => {
    const start = angleOf(a);
    const end = angleOf(b);
    const [x1, y1] = pt(cx, cy, r, start);
    const [x2, y2] = pt(cx, cy, r, end);
    const large = Math.abs(start - end) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const inRange = value >= min && value <= max;
  const [mx, my] = pt(cx, cy, r, angleOf(value));

  return (
    <Box sx={{ width: '100%', maxWidth: 180, mx: 'auto' }}>
      <Box component="svg" viewBox="0 0 120 72" sx={{ width: '100%', display: 'block', overflow: 'visible' }}>
        {/* Track */}
        <path d={arc(scaleMin, scaleMax)} fill="none" stroke={theme.palette.divider} strokeWidth={9} strokeLinecap="round" />
        {/* Good band (min..max) */}
        <path d={arc(min, max)} fill="none" stroke={theme.palette.success.main} strokeWidth={9} strokeLinecap="round" opacity={0.55} />
        {/* Upper hysteresis band */}
        {hysteresis > 0 && (
          <path d={arc(Math.max(min, max - hysteresis), max)} fill="none" stroke={theme.palette.warning.main} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        )}
        {/* Current value marker: a soft glow makes the reading pop, and the position eases along
            the arc when the value changes so it feels alive (cx/cy are animatable in SVG). */}
        <circle cx={mx} cy={my} r={6} fill={inRange ? theme.palette.success.main : theme.palette.error.main}
          stroke={theme.palette.background.paper} strokeWidth={2}
          style={{
            filter: `drop-shadow(0 0 5px ${alpha(inRange ? theme.palette.success.main : theme.palette.error.main, 0.7)})`,
            transition: 'cx 0.5s ease, cy 0.5s ease',
          }} />
        {/* Min / max end labels */}
        <text x={pt(cx, cy, r, 180)[0]} y={cy + 12} textAnchor="middle" fontSize={8} fill={theme.palette.text.secondary}>{min}</text>
        <text x={pt(cx, cy, r, 0)[0]} y={cy + 12} textAnchor="middle" fontSize={8} fill={theme.palette.text.secondary}>{max}</text>
        {showValue && (
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={16} fontWeight={700} fill={theme.palette.text.primary}>
            {formatNumber(value)}{unit}
          </text>
        )}
      </Box>
    </Box>
  );
}
