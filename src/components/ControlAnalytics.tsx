import { Box, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ConfigResponse, MeasurementResponse } from '../api/types';
import { formatNumber } from '../lib/format';

type StatAccent = 'primary' | 'secondary' | 'success' | 'warning';

function StatTile({ label, value, hint, accent = 'primary' }: {
  label: string; value: string; hint?: string; accent?: StatAccent;
}) {
  return (
    <Box sx={(t) => ({
      p: 1.5, borderRadius: 2, height: '100%',
      bgcolor: alpha(t.palette[accent].main, t.palette.mode === 'light' ? 0.08 : 0.14),
      borderLeft: `3px solid ${t.palette[accent].main}`,
    })}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Box>
  );
}

function pct(part: number, total: number): string {
  return total === 0 ? '—' : `${formatNumber((part / total) * 100)} %`;
}

function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h} h ${mins % 60} min`;
}

/**
 * Turns the raw readings of the selected range into control-oriented insights: min/max/avg,
 * time spent out of the configured band, the cooler duty cycle, and an ON/OFF timeline that
 * visualises the controller acting against the hysteresis band.
 */
export function ControlAnalytics({ points, config }: {
  points: MeasurementResponse[];
  config?: ConfigResponse;
}) {
  if (points.length === 0) return null;

  const n = points.length;
  const temps = points.map((p) => p.temperature);
  const hums = points.map((p) => p.humidity);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  const tOut = config ? points.filter((p) => p.temperature < config.temperatureMin || p.temperature > config.temperatureMax).length : 0;
  const hOut = config ? points.filter((p) => p.humidity < config.humidityMin || p.humidity > config.humidityMax).length : 0;
  const coolerOnCount = points.filter((p) => p.coolerOn).length;

  // Cooler ON/OFF runs, weighted by elapsed time between consecutive readings.
  const first = new Date(points[0].createdAt).getTime();
  const last = new Date(points[n - 1].createdAt).getTime();
  const span = Math.max(1, last - first);
  const runs: { on: boolean; widthPct: number; ms: number }[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const ms = new Date(points[i + 1].createdAt).getTime() - new Date(points[i].createdAt).getTime();
    const on = points[i].coolerOn;
    const prev = runs[runs.length - 1];
    if (prev && prev.on === on) { prev.ms += ms; prev.widthPct += (ms / span) * 100; }
    else runs.push({ on, ms, widthPct: (ms / span) * 100 });
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile accent="primary" label="Temp prom" value={`${formatNumber(avg(temps))} °C`}
            hint={`mín ${formatNumber(Math.min(...temps))} · máx ${formatNumber(Math.max(...temps))}`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile accent="secondary" label="Humedad prom" value={`${formatNumber(avg(hums))} %`}
            hint={`mín ${formatNumber(Math.min(...hums))} · máx ${formatNumber(Math.max(...hums))}`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile accent="warning" label="Fuera de rango" value={config ? pct(tOut, n) : '—'}
            hint={config ? `temp · humedad ${pct(hOut, n)}` : 'sin config activa'} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile accent="success" label="Cooler encendido" value={pct(coolerOnCount, n)} hint="del tiempo (duty cycle)" />
        </Grid>
      </Grid>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Actividad del cooler
        </Typography>
        <Box sx={{ display: 'flex', height: 14, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}>
          {runs.map((r, i) => (
            <Tooltip key={i} title={`${r.on ? 'Encendido' : 'Apagado'} · ${formatDuration(r.ms)}`}>
              <Box sx={{
                width: `${r.widthPct}%`,
                bgcolor: r.on ? 'success.main' : 'transparent',
                opacity: r.on ? 0.85 : 1,
              }} />
            </Tooltip>
          ))}
        </Box>
        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'success.main', opacity: 0.85 }} />
            <Typography variant="caption" color="text.secondary">Encendido</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'action.hover' }} />
            <Typography variant="caption" color="text.secondary">Apagado</Typography>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
