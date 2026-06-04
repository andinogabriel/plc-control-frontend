import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Grid, Card, CardActionArea, CardContent, Typography, Box, CircularProgress, Alert, Stack,
  MenuItem, TextField, useMediaQuery, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import InsightsIcon from '@mui/icons-material/Insights';
import dayjs from 'dayjs';
import { measurementApi } from '../api/measurementApi';
import { configApi } from '../api/configApi';
import { StatusChip } from '../components/StatusChip';
import { AreaLineChart } from '../components/AreaLineChart';
import { DetailDialog } from '../components/DetailDialog';
import type { MeasurementResponse } from '../api/types';
import { useState } from 'react';

type AccentColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

const RANGE_OPTIONS = [
  { value: '1h', label: 'Última hora', ms: 60 * 60 * 1000 },
  { value: '12h', label: 'Últimas 12 h', ms: 12 * 60 * 60 * 1000 },
  { value: '24h', label: 'Último día', ms: 24 * 60 * 60 * 1000 },
  { value: '7d', label: 'Última semana', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: '30d', label: 'Último mes', ms: 30 * 24 * 60 * 60 * 1000 },
  { value: '365d', label: 'Último año', ms: 365 * 24 * 60 * 60 * 1000 },
];

function MetricCard({ icon, label, value, color = 'primary', onClick, children }: {
  icon: React.ReactNode; label: string; value?: string; color?: AccentColor;
  onClick: () => void; children?: React.ReactNode;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ minHeight: 168, p: 2.5 }}>
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
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.25 }}>{value}</Typography>
          )}
          <Box mt={1.25}>{children}</Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selected, setSelected] = useState<MeasurementResponse | null>(null);
  const [range, setRange] = useState('24h');
  const rangeMs = RANGE_OPTIONS.find((o) => o.value === range)?.ms ?? RANGE_OPTIONS[2].ms;

  const { data: latest, isLoading, isError } = useQuery({
    queryKey: ['measurement-latest'],
    queryFn: measurementApi.getLatest,
    refetchInterval: 5000,
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
    refetchInterval: 15000,
  });

  if (isLoading) {
    return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  }

  if (isError || !latest) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <Alert severity="info">
          Todavía no hay mediciones registradas. La Raspberry debe hacer POST a /api/measurements.
        </Alert>
      </Box>
    );
  }

  const goToMeasurements = () => navigate('/mediciones');
  const updated = new Date(latest.createdAt).toLocaleString();

  const chartPoints = (recent?.content ?? []).slice().reverse();
  const labels = chartPoints.map((m) => new Date(m.createdAt));
  const rangeLabel = chartPoints.length > 0
    ? `${dayjs(labels[0]).format('D MMM YYYY HH:mm')} – ${dayjs(labels[labels.length - 1]).format('D MMM YYYY HH:mm')}`
    : '';

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard icon={<ThermostatIcon />} color="primary" label="Temperatura actual"
            value={`${latest.temperature.toFixed(1)} °C`} onClick={goToMeasurements}>
            {config && (
              <Typography variant="caption" color="text.secondary">
                Rango: {config.temperatureMin}–{config.temperatureMax} °C
              </Typography>
            )}
          </MetricCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard icon={<WaterDropIcon />} color="secondary" label="Humedad actual"
            value={`${latest.humidity.toFixed(1)} %`} onClick={goToMeasurements}>
            {config && (
              <Typography variant="caption" color="text.secondary">
                Rango: {config.humidityMin}–{config.humidityMax} %
              </Typography>
            )}
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
                    { id: 'temp', label: 'Temperatura (°C)', data: chartPoints.map((m) => m.temperature), color: '#6366f1' },
                    { id: 'hum', label: 'Humedad (%)', data: chartPoints.map((m) => m.humidity), color: '#14b8a6' },
                  ]}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">Sin datos recientes.</Typography>
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
