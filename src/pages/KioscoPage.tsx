import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Box, Chip, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import InsightsIcon from '@mui/icons-material/Insights';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import dayjs from 'dayjs';
import { measurementApi } from '../api/measurementApi';
import { configApi } from '../api/configApi';
import { AreaLineChart } from '../components/AreaLineChart';
import { StatusChip } from '../components/StatusChip';
import { SystemHealthBadge } from '../components/SystemHealthBadge';
import { useCountUp } from '../hooks/useCountUp';
import { formatNumber } from '../lib/format';

const RANGE_MS = 2 * 60 * 60 * 1000; // last 2 hours

function BigTile({ icon, label, value, unit, accent, out }: {
  icon: React.ReactNode; label: string; value: string; unit?: string; accent: string; out?: boolean;
}) {
  return (
    <Box sx={(t) => ({
      flex: 1, minWidth: 200, p: { xs: 2.5, md: 3 }, borderRadius: 4,
      border: `1px solid ${out ? t.palette.warning.main : t.palette.divider}`,
      bgcolor: 'background.paper',
      // Accent tint in the metric colour (warning when out of range) for depth on the big screen.
      backgroundImage: out
        ? `linear-gradient(150deg, ${alpha(t.palette.warning.main, 0.16)}, ${alpha(t.palette.warning.main, 0.03)})`
        : `linear-gradient(150deg, ${alpha(accent, 0.12)}, ${alpha(accent, 0)} 65%)`,
    })}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: accent, bgcolor: alpha(accent, 0.16) }}>
          {icon}
        </Box>
        <Typography variant="overline" sx={{ letterSpacing: '0.08em', fontWeight: 700, color: accent }}>{label}</Typography>
        {out && <Chip size="small" color="warning" label="Fuera de rango" sx={{ ml: 'auto' }} />}
      </Stack>
      {/* Number and unit kept on one line: the big value never wraps ("23,0" / "°C"), and the
          smaller unit reads as a suffix instead of stealing space from the figure. */}
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: 40, md: 64 }, lineHeight: 1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Typography>
        {unit && (
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 18, md: 28 }, lineHeight: 1, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {unit}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

/**
 * Full-screen live monitor for presenting the system (e.g. the TP defence): oversized readings,
 * a live chart and auto-refresh, with no app chrome. Rendered outside the main Layout.
 */
export function KioscoPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => dayjs());
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 1000);
    const onFs = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => { clearInterval(id); document.removeEventListener('fullscreenchange', onFs); };
  }, []);

  const { data: latest } = useQuery({
    queryKey: ['measurement-latest'], queryFn: measurementApi.getLatest, retry: false, refetchInterval: 5000,
  });
  const { data: config } = useQuery({ queryKey: ['config-latest'], queryFn: configApi.getLatest, retry: false });
  const { data: recent } = useQuery({
    queryKey: ['measurements-recent', 'kiosk'],
    queryFn: () => measurementApi.getMeasurements({ page: 0, size: 800, from: new Date(Date.now() - RANGE_MS).toISOString() }),
    refetchInterval: 10000,
    placeholderData: keepPreviousData,
  });

  const tempCount = useCountUp(latest?.temperature ?? 0);
  const humCount = useCountUp(latest?.humidity ?? 0);
  const tempOut = config && latest ? latest.temperature < config.temperatureMin || latest.temperature > config.temperatureMax : false;
  const humOut = config && latest ? latest.humidity < config.humidityMin || latest.humidity > config.humidityMax : false;

  const points = (recent?.content ?? []).slice().reverse();
  const labels = points.map((m) => new Date(m.createdAt));

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else document.documentElement.requestFullscreen().catch(() => undefined);
  };

  const exit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    navigate('/tablero');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <ThermostatIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Monitor en vivo</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <SystemHealthBadge />
        <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
          {now.format('HH:mm:ss')}
        </Typography>
        <Tooltip title={isFs ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          <IconButton onClick={toggleFullscreen}>{isFs ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}</IconButton>
        </Tooltip>
        <Tooltip title="Salir del modo kiosco">
          <IconButton onClick={exit}><CloseRoundedIcon /></IconButton>
        </Tooltip>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <BigTile icon={<ThermostatIcon />} accent={theme.palette.primary.main} label="Temperatura"
          value={latest ? formatNumber(tempCount) : '—'} unit={latest ? '°C' : undefined} out={tempOut} />
        <BigTile icon={<WaterDropIcon />} accent={theme.palette.secondary.main} label="Humedad"
          value={latest ? formatNumber(humCount) : '—'} unit={latest ? '%' : undefined} out={humOut} />
        <BigTile icon={<AcUnitIcon />} accent={latest?.coolerOn ? theme.palette.success.main : theme.palette.text.secondary}
          label="Cooler" value={latest ? (latest.coolerOn ? 'ON' : 'OFF') : '—'} />
        <Box sx={(t) => ({
          flex: 1, minWidth: 200, p: { xs: 2.5, md: 3 }, borderRadius: 4,
          border: `1px solid ${t.palette.divider}`, bgcolor: 'background.paper',
          backgroundImage: `linear-gradient(150deg, ${alpha(t.palette.warning.main, 0.12)}, ${alpha(t.palette.warning.main, 0)} 65%)`,
        })}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
            <Box sx={(t) => ({ width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: 'warning.main', bgcolor: alpha(t.palette.warning.main, 0.16) })}>
              <InsightsIcon />
            </Box>
            <Typography variant="overline" sx={{ letterSpacing: '0.08em', fontWeight: 700, color: 'warning.main' }}>Estado</Typography>
          </Stack>
          <Box>{latest ? <StatusChip status={latest.status} /> : <Typography variant="h4">—</Typography>}</Box>
          {config && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Rango T {config.temperatureMin}–{config.temperatureMax} °C · H {config.humidityMin}–{config.humidityMax} %
            </Typography>
          )}
        </Box>
      </Stack>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 1.5, md: 3 }, borderRadius: 4, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Últimas 2 horas</Typography>
        {points.length > 0 ? (
          <AreaLineChart
            height={360}
            mode="time"
            labels={labels}
            series={[
              { id: 'temp', label: 'Temperatura (°C)', data: points.map((m) => m.temperature), color: theme.palette.primary.main },
              { id: 'hum', label: 'Humedad (%)', data: points.map((m) => m.humidity), color: theme.palette.secondary.main },
            ]}
          />
        ) : (
          <Stack spacing={1} sx={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', color: 'text.secondary', py: 6 }}>
            <ShowChartRoundedIcon sx={{ fontSize: 48, opacity: 0.5 }} />
            <Typography variant="body2">Esperando mediciones…</Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
