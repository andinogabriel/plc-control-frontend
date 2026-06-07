import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Grid, Card, CardActionArea, CardContent, Typography, Box, Alert, Button, Stack, Chip,
  MenuItem, TextField, Skeleton, useMediaQuery, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import InsightsIcon from '@mui/icons-material/Insights';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import dayjs from 'dayjs';
import { measurementApi } from '../api/measurementApi';
import { configApi } from '../api/configApi';
import { StatusChip } from '../components/StatusChip';
import { AreaLineChart } from '../components/AreaLineChart';
import { DetailDialog } from '../components/DetailDialog';
import { EmptyState } from '../components/EmptyState';
import { Sparkline } from '../components/Sparkline';
import { Delta } from '../components/Delta';
import { RefreshControl } from '../components/RefreshControl';
import { useCountUp } from '../hooks/useCountUp';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { formatRelative } from '../lib/time';
import { formatPct, formatTemp } from '../lib/format';
import type { MeasurementResponse } from '../api/types';

type AccentColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

const RANGE_OPTIONS = [
  { value: '1h', label: 'Última hora', ms: 60 * 60 * 1000 },
  { value: '12h', label: 'Últimas 12 h', ms: 12 * 60 * 60 * 1000 },
  { value: '24h', label: 'Último día', ms: 24 * 60 * 60 * 1000 },
  { value: '7d', label: 'Última semana', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: '30d', label: 'Último mes', ms: 30 * 24 * 60 * 60 * 1000 },
  { value: '365d', label: 'Último año', ms: 365 * 24 * 60 * 60 * 1000 },
];

const SPARK_POINTS = 24;

function MetricCard({ icon, label, value, color = 'primary', onClick, children }: {
  icon: React.ReactNode; label: string; value?: React.ReactNode; color?: AccentColor;
  onClick: () => void; children?: React.ReactNode;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ minHeight: 172, p: 2.5 }}>
          <Box sx={(t) => ({
            width: 44, height: 44, borderRadius: 2.5, mb: 1.75,
            display: 'grid', placeItems: 'center',
            color: t.palette[color].main,
            backgroundColor: alpha(t.palette[color].main, 0.12),
          })}>
            {icon}
          </Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.06em' }}>
            {label}
          </Typography>
          {value !== undefined && (
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.25 }} component="div">{value}</Typography>
          )}
          <Box mt={1.25}>{children}</Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ minHeight: 172, p: 2.5 }}>
        <Skeleton variant="rounded" width={44} height={44} sx={{ mb: 1.75, borderRadius: 2.5 }} />
        <Skeleton width="60%" height={16} />
        <Skeleton width="45%" height={40} sx={{ mt: 0.5 }} />
        <Skeleton width="80%" height={20} sx={{ mt: 1.25 }} />
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selected, setSelected] = useState<MeasurementResponse | null>(null);
  const [range, setRange] = useState('24h');
  const [paused, setPaused] = useState(false);
  const rangeMs = RANGE_OPTIONS.find((o) => o.value === range)?.ms ?? RANGE_OPTIONS[2].ms;

  const { data: latest, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['measurement-latest'],
    queryFn: measurementApi.getLatest,
    refetchInterval: paused ? false : 5000,
    retry: false,
  });

  const { data: config } = useQuery({
    queryKey: ['config-latest'],
    queryFn: configApi.getLatest,
    retry: false,
  });

  const { data: recent } = useQuery({
    queryKey: ['measurements-recent', range],
    queryFn: () => measurementApi.getMeasurements({
      page: 0, size: 1500, from: new Date(Date.now() - rangeMs).toISOString(),
    }),
    refetchInterval: paused ? false : 15000,
  });

  const health = useSystemHealth();
  // Animated KPI values (count-up). Hooks run unconditionally; 0 until data arrives.
  const tempCount = useCountUp(latest?.temperature ?? 0);
  const humCount = useCountUp(latest?.humidity ?? 0);

  const tempOut = config && latest
    ? latest.temperature < config.temperatureMin || latest.temperature > config.temperatureMax : false;
  const humOut = config && latest
    ? latest.humidity < config.humidityMin || latest.humidity > config.humidityMax : false;

  const goToMeasurements = () => navigate('/mediciones');

  // Chronological points for the main chart and the card sparklines/deltas.
  const chartPoints = (recent?.content ?? []).slice().reverse();
  const labels = chartPoints.map((m) => new Date(m.createdAt));
  const tempSeries = chartPoints.map((m) => m.temperature);
  const humSeries = chartPoints.map((m) => m.humidity);
  const tempSpark = tempSeries.slice(-SPARK_POINTS);
  const humSpark = humSeries.slice(-SPARK_POINTS);
  const tempDelta = tempSeries.length >= 2 ? tempSeries[tempSeries.length - 1] - tempSeries[tempSeries.length - 2] : null;
  const humDelta = humSeries.length >= 2 ? humSeries[humSeries.length - 1] - humSeries[humSeries.length - 2] : null;

  const rangeLabel = chartPoints.length > 0
    ? `${dayjs(labels[0]).format('D MMM YYYY HH:mm')} – ${dayjs(labels[labels.length - 1]).format('D MMM YYYY HH:mm')}`
    : '';

  const header = (
    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
      <Typography variant="h4">Dashboard</Typography>
      {!isLoading && !isError && (
        <RefreshControl lastUpdated={dataUpdatedAt} paused={paused} onToggle={() => setPaused((p) => !p)} />
      )}
    </Stack>
  );

  if (isLoading) {
    return (
      <Box>
        {header}
        <Grid container spacing={3}>
          {[0, 1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}><MetricCardSkeleton /></Grid>
          ))}
          <Grid size={12}>
            <Card><CardContent><Skeleton variant="rounded" height={isMobile ? 260 : 340} /></CardContent></Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (isError || !latest) {
    return (
      <Box>
        {header}
        <Card>
          <CardContent>
            <EmptyState
              icon={<ShowChartRoundedIcon sx={{ fontSize: 30 }} />}
              title="Todavía no hay mediciones"
              description={config
                ? 'La Raspberry debe hacer POST a /api/measurements para empezar a registrar lecturas.'
                : 'Empezá configurando los umbrales; luego la Raspberry comenzará a reportar.'}
              action={!config && (
                <Button variant="contained" onClick={() => navigate('/configuracion')}>
                  Configurar umbrales
                </Button>
              )}
            />
          </CardContent>
        </Card>
      </Box>
    );
  }

  const updated = new Date(latest.createdAt).toLocaleString();

  return (
    <Box>
      {header}

      {(health.status === 'offline' || health.status === 'delayed') && (
        <Alert severity={health.status === 'offline' ? 'error' : 'warning'} icon={<WarningAmberRoundedIcon />} sx={{ mb: 2 }}>
          {health.status === 'offline'
            ? 'Sin datos recientes: la Raspberry podría estar desconectada.'
            : 'Las mediciones están llegando con demora.'}
          {health.lastAt && ` Última lectura ${formatRelative(health.lastAt)}.`}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard icon={<ThermostatIcon />} color={tempOut ? 'warning' : 'primary'} label="Temperatura actual"
            value={(
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <span>{formatTemp(tempCount)}</span>
                {tempDelta != null && <Delta value={tempDelta} unit="°C" />}
              </Stack>
            )}
            onClick={goToMeasurements}>
            <Sparkline data={tempSpark} color={theme.palette.primary.main} />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              {config && (
                <Typography variant="caption" color="text.secondary">
                  Rango: {config.temperatureMin}–{config.temperatureMax} °C
                </Typography>
              )}
              {tempOut && <Chip size="small" color="warning" variant="outlined" label="Fuera de rango" />}
            </Stack>
          </MetricCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard icon={<WaterDropIcon />} color={humOut ? 'warning' : 'secondary'} label="Humedad actual"
            value={(
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <span>{formatPct(humCount)}</span>
                {humDelta != null && <Delta value={humDelta} unit="%" />}
              </Stack>
            )}
            onClick={goToMeasurements}>
            <Sparkline data={humSpark} color={theme.palette.secondary.main} />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              {config && (
                <Typography variant="caption" color="text.secondary">
                  Rango: {config.humidityMin}–{config.humidityMax} %
                </Typography>
              )}
              {humOut && <Chip size="small" color="warning" variant="outlined" label="Fuera de rango" />}
            </Stack>
          </MetricCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard icon={<AcUnitIcon />} color={latest.coolerOn ? 'success' : 'secondary'}
            label="Estado del cooler" value={latest.coolerOn ? 'ENCENDIDO' : 'APAGADO'}
            onClick={goToMeasurements} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard icon={<InsightsIcon />} color="warning" label="Estado general"
            onClick={goToMeasurements}>
            <Stack spacing={1.25}>
              <Box><StatusChip status={latest.status} /></Box>
              <Typography variant="caption" color="text.secondary">Actualizado: {updated}</Typography>
            </Stack>
          </MetricCard>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1">Últimas lecturas</Typography>
                <TextField
                  select size="small" value={range} onChange={(e) => setRange(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  {RANGE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              {rangeLabel && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {rangeLabel}
                </Typography>
              )}
              {chartPoints.length > 0 ? (
                <AreaLineChart
                  height={isMobile ? 260 : 340}
                  mode={range === '1h' || range === '12h' || range === '24h' ? 'time' : 'date'}
                  labels={labels}
                  onPointClick={(i) => setSelected(chartPoints[i] ?? null)}
                  series={[
                    { id: 'temp', label: 'Temperatura (°C)', data: tempSeries, color: theme.palette.primary.main },
                    { id: 'hum', label: 'Humedad (%)', data: humSeries, color: theme.palette.secondary.main },
                  ]}
                />
              ) : (
                <EmptyState
                  icon={<ShowChartRoundedIcon sx={{ fontSize: 30 }} />}
                  title="Sin lecturas en este rango"
                  description="Probá ampliar el rango de tiempo o esperá la próxima medición de la Raspberry."
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DetailDialog
        open={selected !== null}
        title="Detalle de medición"
        onClose={() => setSelected(null)}
        rows={selected ? [
          { label: 'Fecha', value: new Date(selected.createdAt).toLocaleString() },
          { label: 'Temperatura', value: `${selected.temperature} °C` },
          { label: 'Humedad', value: `${selected.humidity} %` },
          { label: 'Cooler', value: selected.coolerOn ? 'ON' : 'OFF' },
          { label: 'Relay', value: selected.relayOn ? 'ON' : 'OFF' },
          { label: 'Estado', value: <StatusChip status={selected.status} /> },
        ] : []}
      />
    </Box>
  );
}
