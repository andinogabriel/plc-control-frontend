import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Grid, Card, CardActionArea, CardContent, Typography, Box, CircularProgress, Alert, Stack,
  useMediaQuery, useTheme,
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

type AccentColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

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
    queryKey: ['measurements-recent'],
    queryFn: () => measurementApi.getMeasurements({ page: 0, size: 48 }),
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
              <Typography variant="subtitle1">Últimas lecturas</Typography>
              {rangeLabel && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {rangeLabel}
                </Typography>
              )}
              {chartPoints.length > 0 ? (
                <AreaLineChart
                  height={isMobile ? 260 : 340}
                  mode="time"
                  labels={labels}
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
    </Box>
  );
}
