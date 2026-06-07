import { Box, Stack, Typography } from '@mui/material';

/**
 * Small live visualisation of the cooler's deadband for one variable: an OFF zone, the
 * hysteresis band, and the ON zone, plus a plain-language summary. Driven by the live form
 * values so the user sees the effect of the threshold/hysteresis they are typing.
 */
export function HysteresisDiagram({ label, unit, min, max, hysteresis }: {
  label: string; unit: string; min?: number; max?: number; hysteresis?: number;
}) {
  const valid = min != null && max != null && hysteresis != null && max > min && hysteresis > 0 && hysteresis < (max - min);
  if (!valid) {
    return (
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', color: 'text.secondary' }}>
        <Typography variant="caption">{label}: completá mín, máx e histéresis para ver la banda del cooler.</Typography>
      </Box>
    );
  }

  const offEnd = max - hysteresis;
  const hi = max + (max - min) * 0.3;
  const span = hi - min;
  const wOff = ((offEnd - min) / span) * 100;
  const wBand = ((max - offEnd) / span) * 100;
  const wOn = ((hi - max) / span) * 100;

  return (
    <Stack spacing={0.75}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Box sx={{ display: 'flex', height: 14, borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{ width: `${wOff}%`, bgcolor: 'info.main', opacity: 0.45 }} />
        <Box sx={{ width: `${wBand}%`, bgcolor: 'warning.main', opacity: 0.65 }} />
        <Box sx={{ width: `${wOn}%`, bgcolor: 'error.main', opacity: 0.55 }} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">OFF</Typography>
        <Typography variant="caption" color="text.secondary">histéresis</Typography>
        <Typography variant="caption" color="text.secondary">ON</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Enciende al llegar a <b>{max}{unit}</b> y apaga al bajar a <b>{offEnd.toFixed(1)}{unit}</b>.
      </Typography>
    </Stack>
  );
}
