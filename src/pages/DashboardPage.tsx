import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Grid, Card, CardActionArea, CardContent, Typography, Box, Alert, Button, IconButton, Stack, Chip,
  MenuItem, TextField, Skeleton, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AxiosError } from 'axios';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import SlideshowRoundedIcon from '@mui/icons-material/SlideshowRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
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
import { FadeIn } from '../components/FadeIn';
import { DetailDialog } from '../components/DetailDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Sparkline } from '../components/Sparkline';
import { RadialGauge } from '../components/RadialGauge';
import { Delta } from '../components/Delta';
import { RefreshControl } from '../components/RefreshControl';
import { ControlAnalytics } from '../components/ControlAnalytics';
import { exportChartPng } from '../lib/exporters';
import { useCountUp } from '../hooks/useCountUp';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { formatRelative } from '../lib/time';
import { formatPct, formatTemp } from '../lib/format';
import type { MeasurementResponse } from '../api/types';

type AccentColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const RANGE_OPTIONS = [
  { value: '10m', label: 'Últimos 10 min', ms: 10 * MIN },
  { value: '30m', label: 'Última media hora', ms: 30 * MIN },
  { value: '1h', label: 'Última hora', ms: HOUR },
  { value: '2h', label: 'Últimas 2 h', ms: 2 * HOUR },
  { value: '6h', label: 'Últimas 6 h', ms: 6 * HOUR },
  { value: '12h', label: 'Últimas 12 h', ms: 12 * HOUR },
  { value: '24h', label: 'Último día', ms: DAY },
  { value: '7d', label: 'Última semana', ms: 7 * DAY },
  { value: '30d', label: 'Último mes', ms: 30 * DAY },
  { value: '365d', label: 'Último año', ms: 365 * DAY },
];

const rangeMsOf = (value: string) => RANGE_OPTIONS.find((o) => o.value === value)?.ms ?? DAY;
// Intraday ranges (<= 1 day) show time-of-day ticks; longer ones show dates.
const modeOf = (value: string): 'time' | 'date' => (rangeMsOf(value) <= DAY ? 'time' : 'date');

const SPARK_POINTS = 24;

function MetricCard({ icon, label, value, color = 'primary', onClick, children, index = 0 }: {
  icon: React.ReactNode; label: string; value?: React.ReactNode; color?: AccentColor;
  onClick: () => void; children?: React.ReactNode; index?: number;
}) {
  return (
    <Card sx={(t) => ({
      height: '100%',
      // Faint diagonal tint in the metric's accent colour: gives each card a subtle identity
      // and depth without competing with the content. Barely-there in both light and dark.
      backgroundImage: `linear-gradient(150deg, ${alpha(t.palette[color].main, 0.07)}, ${alpha(t.palette[color].main, 0)} 60%)`,
      transition: t.transitions.create('box-shadow', { duration: 180 }),
      '@media (hover: hover)': {
        '&:hover': { boxShadow: `0 10px 28px ${alpha(t.palette[color].main, 0.2)}` },
      },
      // Staggered fade-up on mount (e.g. when entering the dashboard). Runs once; honours
      // reduced-motion. `both` holds the cards hidden until each one's delay elapses.
      '@keyframes metricIn': {
        from: { opacity: 0, transform: 'translateY(10px)' },
        to: { opacity: 1, transform: 'none' },
      },
      animation: `metricIn 420ms ease ${index * 80}ms both`,
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    })}>
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
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.25 }} component="div">{value}</Typography>
          )}
          <Box sx={{ mt: 1.25 }}>{children}</Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function MetricCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ minHeight: 172, p: 2.5 }}>
        <Skeleton variant="rounded" width={44} height={44} sx={{ mb: 1.75, borderRadius: 2.5 }} />
        <Skeleton width="60%" height={16} />
        <Skeleton width="45%" height={40} sx={{ mt: 0.5 }} />
        {/* Reserve the gauge area for the temperature/humidity cards so the skeleton matches the
            real card height and the layout does not jump when data arrives. */}
        {tall && <Skeleton variant="rounded" width={150} height={96} sx={{ mt: 1.5, mx: 'auto', borderRadius: 2 }} />}
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
  const [range, setRange] = useState(() => localStorage.getItem('dashboardRange') ?? '24h');
  const [analyticsRange, setAnalyticsRange] = useState(() => localStorage.getItem('dashboardAnalyticsRange') ?? '7d');
  const [paused, setPaused] = useState(false);
  const [compare, setCompare] = useState(false);
  useEffect(() => { localStorage.setItem('dashboardAnalyticsRange', analyticsRange); }, [analyticsRange]);
  const chartRef = useRef<HTMLDivElement>(null);
  const printTimeRef = useRef<HTMLSpanElement>(null);

  // Before printing: (1) stamp a full date/time (with seconds) into the print-only label, and
  // (2) apply the print layout (body.print-mode) at the real A4-landscape page width, then scale
  // with `zoom` so the whole dashboard fills exactly one page. Measuring with the print layout
  // active (not the screen layout) is what makes the fit correct. Reset afterwards.
  useEffect(() => {
    // A4 portrait at 96dpi (the dashboard is tall, so portrait fills the page best).
    const PAGE_W = (210 / 25.4) * 96;
    const PAGE_H = (297 / 25.4) * 96;
    const stamp = () => {
      if (printTimeRef.current) printTimeRef.current.textContent = `Actualizado: ${new Date().toLocaleString('es-AR')}`;
    };
    const onBefore = () => {
      stamp();
      const el = document.getElementById('main-content');
      if (!el) return;
      document.body.classList.add('print-mode');
      el.style.zoom = '1';
      el.style.width = `${PAGE_W}px`;
      const z = Math.min(1, PAGE_H / el.scrollHeight);
      el.style.zoom = String(Math.max(0.4, z));
    };
    const onAfter = () => {
      const el = document.getElementById('main-content');
      document.body.classList.remove('print-mode');
      if (el) { el.style.zoom = ''; el.style.width = ''; }
    };
    stamp();
    window.addEventListener('beforeprint', onBefore);
    window.addEventListener('afterprint', onAfter);
    return () => {
      window.removeEventListener('beforeprint', onBefore);
      window.removeEventListener('afterprint', onAfter);
    };
  }, []);
  useEffect(() => { localStorage.setItem('dashboardRange', range); }, [range]);
  const rangeMs = rangeMsOf(range);
  const analyticsRangeMs = rangeMsOf(analyticsRange);
  // Reserve a stable height for the chart/analytics areas so the cards don't resize with/without data.
  const chartBlock = (isMobile ? 260 : 340) + 78;
  const analyticsBlock = 150;

  const { data: latest, isLoading, isError, error, dataUpdatedAt, refetch: refetchLatest } = useQuery({
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

  const { data: recent, isLoading: recentLoading, isError: recentError, refetch: refetchRecent } = useQuery({
    queryKey: ['measurements-recent', range],
    queryFn: () => measurementApi.getMeasurements({
      page: 0, size: 1500, from: new Date(Date.now() - rangeMs).toISOString(),
    }),
    refetchInterval: paused ? false : 15000,
    placeholderData: keepPreviousData,
  });

  // Independent window for the "Análisis del rango" panel (its own range selector).
  const { data: analyticsData, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ['measurements-analytics', analyticsRange],
    queryFn: () => measurementApi.getMeasurements({
      page: 0, size: 1500, from: new Date(Date.now() - analyticsRangeMs).toISOString(),
    }),
    refetchInterval: paused ? false : 15000,
    placeholderData: keepPreviousData,
  });

  // Previous equal-length window, only fetched when the comparison is on.
  const { data: previous } = useQuery({
    queryKey: ['measurements-previous', range],
    queryFn: () => measurementApi.getMeasurements({
      page: 0, size: 1500,
      from: new Date(Date.now() - 2 * rangeMs).toISOString(),
      to: new Date(Date.now() - rangeMs).toISOString(),
    }),
    enabled: compare,
    placeholderData: keepPreviousData,
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

  // Analysis panel: its own points and date-range caption.
  const analyticsPoints = (analyticsData?.content ?? []).slice().reverse();
  const analyticsRangeLabel = analyticsPoints.length > 0
    ? `${dayjs(analyticsPoints[0].createdAt).format('D MMM YYYY HH:mm')} – ${dayjs(analyticsPoints[analyticsPoints.length - 1].createdAt).format('D MMM YYYY HH:mm')}`
    : '';

  // Comparison: align the previous window onto the current x-axis by relative position.
  const prevPoints = (previous?.content ?? []).slice().reverse();
  const alignPrev = (select: (m: MeasurementResponse) => number) => chartPoints.map((_, i) => {
    const idx = Math.round((i / Math.max(1, chartPoints.length - 1)) * (prevPoints.length - 1));
    return select(prevPoints[idx]);
  });
  const showCompare = compare && prevPoints.length > 0 && chartPoints.length > 0;

  const chartSeries = [
    { id: 'temp', label: 'Temperatura (°C)', data: tempSeries, color: theme.palette.primary.main },
    { id: 'hum', label: 'Humedad (%)', data: humSeries, color: theme.palette.secondary.main },
    ...(showCompare ? [
      { id: 'temp-prev', label: 'Temp. anterior', data: alignPrev((m) => m.temperature), color: theme.palette.primary.main, dashed: true },
      { id: 'hum-prev', label: 'Humedad anterior', data: alignPrev((m) => m.humidity), color: theme.palette.secondary.main, dashed: true },
    ] : []),
  ];

  const header = (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline' }}>
        <Typography variant="h4">Dashboard</Typography>
        <Typography component="span" ref={printTimeRef} className="print-only" variant="body2" color="text.secondary" />
      </Stack>
      <Stack className="no-print" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {!isLoading && !isError && (
          <RefreshControl lastUpdated={dataUpdatedAt} paused={paused} onToggle={() => setPaused((p) => !p)} />
        )}
        <Tooltip title="Modo kiosco (pantalla completa)">
          <IconButton size="small" onClick={() => navigate('/kiosco')} aria-label="Modo kiosco" className="no-print">
            <SlideshowRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Imprimir / guardar PDF">
          <IconButton size="small" onClick={() => window.print()} aria-label="Imprimir" className="no-print">
            <PrintRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );

  if (isLoading) {
    return (
      <Box>
        {header}
        <Grid container spacing={3}>
          {[true, true, false, false].map((tall, i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}><MetricCardSkeleton tall={tall} /></Grid>
          ))}
          {/* Mirror the loaded layout (range analytics + chart) so the page keeps its height. */}
          <Grid size={12}>
            <Card><CardContent>
              <Skeleton width="30%" height={26} />
              <Skeleton variant="rounded" height={analyticsBlock} sx={{ mt: 1.5 }} />
            </CardContent></Card>
          </Grid>
          <Grid size={12}>
            <Card><CardContent>
              <Skeleton width="30%" height={26} />
              <Skeleton variant="rounded" height={chartBlock} sx={{ mt: 1.5 }} />
            </CardContent></Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (isError || !latest) {
    // A 404 means "no measurements yet" (onboarding); anything else is a real server error.
    const status = (error as AxiosError | null)?.response?.status;
    const serverError = isError && status !== 404;
    return (
      <Box>
        {header}
        <Card>
          <CardContent sx={{ minHeight: { xs: 360, md: 460 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {serverError ? (
              <ErrorState onRetry={() => refetchLatest()} />
            ) : (
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
            )}
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
        <Grid className="dashboard-metric" size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard index={0} icon={<ThermostatIcon />} color={tempOut ? 'warning' : 'primary'} label="Temperatura actual"
            value={(
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                <span>{formatTemp(tempCount)}</span>
                {tempDelta != null && <Delta value={tempDelta} unit="°C" />}
              </Stack>
            )}
            onClick={goToMeasurements}>
            {config
              ? <RadialGauge value={latest.temperature} min={config.temperatureMin} max={config.temperatureMax} hysteresis={config.hysteresisTemperature} unit="°C" />
              : <Sparkline data={tempSpark} color={theme.palette.primary.main} />}
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              {config && (
                <Typography variant="caption" color="text.secondary">
                  Rango: {config.temperatureMin}–{config.temperatureMax} °C
                </Typography>
              )}
              {tempOut && <Chip size="small" color="warning" variant="outlined" label="Fuera de rango" />}
            </Stack>
          </MetricCard>
        </Grid>
        <Grid className="dashboard-metric" size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard index={1} icon={<WaterDropIcon />} color={humOut ? 'warning' : 'secondary'} label="Humedad actual"
            value={(
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                <span>{formatPct(humCount)}</span>
                {humDelta != null && <Delta value={humDelta} unit="%" />}
              </Stack>
            )}
            onClick={goToMeasurements}>
            {config
              ? <RadialGauge value={latest.humidity} min={config.humidityMin} max={config.humidityMax} hysteresis={config.hysteresisHumidity} unit="%" />
              : <Sparkline data={humSpark} color={theme.palette.secondary.main} />}
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              {config && (
                <Typography variant="caption" color="text.secondary">
                  Rango: {config.humidityMin}–{config.humidityMax} %
                </Typography>
              )}
              {humOut && <Chip size="small" color="warning" variant="outlined" label="Fuera de rango" />}
            </Stack>
          </MetricCard>
        </Grid>
        <Grid className="dashboard-metric" size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard index={2} icon={<AcUnitIcon />} color={latest.coolerOn ? 'success' : 'secondary'}
            label="Estado del cooler" value={latest.coolerOn ? 'ENCENDIDO' : 'APAGADO'}
            onClick={goToMeasurements} />
        </Grid>
        <Grid className="dashboard-metric" size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard index={3} icon={<InsightsIcon />} color="warning" label="Estado general"
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
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1">Análisis del rango</Typography>
                <TextField
                  select size="small" value={analyticsRange} onChange={(e) => setAnalyticsRange(e.target.value)}
                  sx={{ minWidth: 170 }}
                >
                  {RANGE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              {analyticsRangeLabel && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {analyticsRangeLabel}
                </Typography>
              )}
              {analyticsLoading ? (
                <Skeleton variant="rounded" height={analyticsBlock} />
              ) : analyticsError ? (
                <ErrorState dense height={analyticsBlock} onRetry={() => refetchAnalytics()} />
              ) : analyticsPoints.length > 0 ? (
                <FadeIn><ControlAnalytics points={analyticsPoints} config={config} /></FadeIn>
              ) : (
                <EmptyState dense height={analyticsBlock} icon={<ShowChartRoundedIcon sx={{ fontSize: 30 }} />}
                  title="Sin lecturas en este rango"
                  description="Probá ampliar el rango del análisis." />
              )}
            </CardContent>
          </Card>
        </Grid>


        <Grid size={12}>
          <Card>
            <CardContent ref={chartRef}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1">Últimas lecturas</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Chip
                    icon={<CompareArrowsRoundedIcon />}
                    label="Período anterior"
                    color={compare ? 'primary' : 'default'}
                    variant={compare ? 'filled' : 'outlined'}
                    onClick={() => setCompare((c) => !c)}
                    sx={{ fontWeight: 600 }}
                  />
                  <TextField
                    select size="small" value={range} onChange={(e) => setRange(e.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    {RANGE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </TextField>
                  <Tooltip title="Descargar PNG">
                    <span>
                      <IconButton size="small" className="no-print" disabled={chartPoints.length === 0}
                        onClick={() => exportChartPng(chartRef.current, 'lecturas.png', { title: 'Últimas lecturas', source: 'Tablero' })}
                        aria-label="Descargar gráfico">
                        <ImageRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
              {rangeLabel && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {rangeLabel}
                </Typography>
              )}
              {recentLoading ? (
                <Skeleton variant="rounded" height={chartBlock} />
              ) : recentError ? (
                <ErrorState height={chartBlock} onRetry={() => refetchRecent()} />
              ) : chartPoints.length > 0 ? (
                <FadeIn>
                  <AreaLineChart
                    height={isMobile ? 260 : 340}
                    zoomable
                    mode={modeOf(range)}
                    labels={labels}
                    onPointClick={(i) => setSelected(chartPoints[i] ?? null)}
                    series={chartSeries}
                  />
                </FadeIn>
              ) : (
                <EmptyState
                  height={chartBlock}
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
