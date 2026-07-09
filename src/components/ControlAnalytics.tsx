import { Box, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ConfigResponse, MeasurementResponse } from '../api/types';
import { formatNumber } from '../lib/format';
import { formatDuration } from '../lib/time';
import { MONO_FONT, lcdScreen } from '../theme';

type StatAccent = 'primary' | 'secondary' | 'success' | 'warning';

function StatTile({ label, value, hint, accent = 'primary' }: {
  label: string; value: string; hint?: string; accent?: StatAccent;
}) {
  return (
    <Box sx={(t) => ({
      p: 1.25, borderRadius: '6px', height: '100%',
      border: `1px solid ${t.palette.divider}`,
      bgcolor: alpha(t.palette[accent].main, t.palette.mode === 'light' ? 0.05 : 0.08),
    })}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 0.75 }}>
        <Box sx={(t) => ({ width: 6, height: 6, borderRadius: '50%', backgroundColor: t.palette[accent].main, flexShrink: 0 })} />
        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }} noWrap>{label}</Typography>
      </Stack>
      {/* Mini LED readout to match the instrument language of the dashboard cards. */}
      <Box sx={(t) => ({ borderRadius: '4px', px: 1, py: 0.5, backgroundColor: lcdScreen(t.palette.mode), border: `1px solid ${alpha('#ffffff', 0.07)}`, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' })}>
        <Typography sx={(t) => ({ fontFamily: MONO_FONT, fontWeight: 600, fontSize: 18, lineHeight: 1.25, fontVariantNumeric: 'tabular-nums', color: t.palette[accent].light, textShadow: `0 0 8px ${alpha(t.palette[accent].light, 0.4)}` })}>
          {value}
        </Typography>
      </Box>
      {hint && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>{hint}</Typography>}
    </Box>
  );
}

function pct(part: number, total: number): string {
  return total === 0 ? '—' : `${formatNumber((part / total) * 100)} %`;
}

/**
 * Turns the raw readings of the selected range into control-oriented insights: min/max/avg,
 * time spent out of the configured band, the cooler duty cycle, and an ON/OFF timeline that
 * visualises the controller acting against the hysteresis band.
 */
export function ControlAnalytics({ points, config, configs }: {
  points: MeasurementResponse[];
  config?: ConfigResponse;
  /** Config history (any order). When provided, band metrics judge each reading against the
   *  config ACTIVE at its time — judging old data by today's thresholds reads as a false
   *  "0 % in band" whenever the band moved. */
  configs?: ConfigResponse[];
}) {
  if (points.length === 0) return null;

  const n = points.length;
  const temps = points.map((p) => p.temperature);
  const hums = points.map((p) => p.humidity);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  // Config active at each reading: walk points (chronological) and the sorted history in
  // lockstep. Readings older than the first known config are judged by that first config —
  // the least-wrong option without inventing bands. Falls back to the current config alone.
  const history = (configs && configs.length > 0 ? [...configs] : config ? [config] : [])
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  let ci = 0;
  const activeAt = points.map((p) => {
    const t = new Date(p.createdAt).getTime();
    while (ci + 1 < history.length && new Date(history[ci + 1].createdAt).getTime() <= t) ci += 1;
    return history[ci];
  });

  const tOut = config ? points.filter((p, i) => p.temperature < activeAt[i].temperatureMin || p.temperature > activeAt[i].temperatureMax).length : 0;
  const hOut = config ? points.filter((p, i) => p.humidity < activeAt[i].humidityMin || p.humidity > activeAt[i].humidityMax).length : 0;
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

  // Control-quality metrics. Cooler cycles = number of ON runs; switching frequency and the mean
  // ON/OFF durations describe the controller's effort. Band metrics (needs config) describe how
  // well it kept the variable inside the configured band.
  const onRuns = runs.filter((r) => r.on);
  const offRuns = runs.filter((r) => !r.on);
  const cycles = onRuns.length;
  const days = span / 86_400_000;
  const cyclesPerDay = days > 0 ? cycles / days : 0;
  const avgOnMs = onRuns.length ? onRuns.reduce((a, r) => a + r.ms, 0) / onRuns.length : 0;
  const avgOffMs = offRuns.length ? offRuns.reduce((a, r) => a + r.ms, 0) / offRuns.length : 0;

  // Split the "in band" metric per variable: a combined temp-AND-humidity figure reads 0 % as soon
  // as one variable sits out of range the whole time, which hides that the other is well controlled.
  const tempInBand = config
    ? points.filter((p, i) => p.temperature >= activeAt[i].temperatureMin && p.temperature <= activeAt[i].temperatureMax).length
    : 0;
  const humInBand = config
    ? points.filter((p, i) => p.humidity >= activeAt[i].humidityMin && p.humidity <= activeAt[i].humidityMax).length
    : 0;
  const tempOvershoot = config
    ? points.reduce((acc, p, i) => Math.max(acc, p.temperature - activeAt[i].temperatureMax, activeAt[i].temperatureMin - p.temperature), 0)
    : 0;

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

      {config && (
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            Calidad de control
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <StatTile accent="primary" label="Temp en banda" value={pct(tempInBand, n)} hint="según config vigente" />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <StatTile accent="secondary" label="Humedad en banda" value={pct(humInBand, n)} hint="según config vigente" />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <StatTile accent="success" label="Ciclos del cooler" value={`${cycles}`}
                hint={`${formatNumber(cyclesPerDay)} /día de conmutación`} />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <StatTile accent="warning" label="Sobreoscilación máx" value={`${formatNumber(tempOvershoot)} °C`}
                hint="fuera de la banda (temp)" />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <StatTile accent="secondary" label="Tiempo medio ON" value={formatDuration(avgOnMs)}
                hint={`OFF ${formatDuration(avgOffMs)} · por ciclo`} />
            </Grid>
          </Grid>
        </Box>
      )}

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
