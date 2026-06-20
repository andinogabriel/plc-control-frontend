import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Box, Grid, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';
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
import { StatusLamp } from '../components/StatusLamp';
import { SystemHealthBadge } from '../components/SystemHealthBadge';
import { useCountUp } from '../hooks/useCountUp';
import { formatNumber } from '../lib/format';
import { MONO_FONT, LCD_SCREEN } from '../theme';

const RANGE_MS = 2 * 60 * 60 * 1000; // last 2 hours

/** Module header strip shared by the kiosk tiles: accent icon + label on the left, tag on the
 *  right, over an accent-tinted bar with a hairline divider. */
function TileHeader({ icon, label, accent, tag, out, children }: {
  icon: React.ReactNode; label: string; accent: string; tag?: string; out?: boolean; children?: React.ReactNode;
}) {
  return (
    <Stack direction="row" sx={(t) => ({
      alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, md: 2.5 }, py: 1,
      backgroundColor: out ? alpha(t.palette.warning.main, 0.12) : alpha(accent, 0.1),
      borderBottom: `1px solid ${t.palette.divider}`,
    })}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Box sx={{ display: 'inline-flex', color: accent, '& svg': { fontSize: 22 } }}>{icon}</Box>
        <Typography variant="overline" sx={{ fontWeight: 700, color: accent }} noWrap>{label}</Typography>
      </Stack>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        {children}
        {tag && <Typography noWrap sx={{ fontFamily: MONO_FONT, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: 'text.disabled' }}>{tag}</Typography>}
      </Stack>
    </Stack>
  );
}

function BigTile({ icon, label, value, unit, accent, out, tag }: {
  icon: React.ReactNode; label: string; value: string; unit?: string; accent: string; out?: boolean; tag?: string;
}) {
  // Brighten the accent so the digits glow on the near-black meter screen.
  const digitColor = lighten(accent, 0.2);
  return (
    <Box sx={(t) => ({
      height: '100%', borderRadius: 2, overflow: 'hidden',
      border: `1px solid ${out ? t.palette.warning.main : t.palette.divider}`,
      bgcolor: 'background.paper',
    })}>
      <TileHeader icon={icon} label={label} accent={accent} tag={tag} out={out}>
        {out && <StatusLamp tone="warning" size={11} pulse />}
      </TileHeader>
      <Box sx={{ p: { xs: 1.75, md: 2.5 } }}>
        {/* LED meter readout: a dark screen in both themes, digits glowing in the accent (warning
            on alarm). Value and unit stay on one line so the figure never wraps. */}
        <Box sx={{
          borderRadius: 1.5, px: { xs: 1.5, md: 2 }, py: { xs: 1, md: 1.5 }, overflow: 'hidden',
          backgroundColor: LCD_SCREEN,
          border: `1px solid ${alpha('#ffffff', 0.07)}`,
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.55)',
        }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', minWidth: 0 }}>
            <Typography sx={(t) => ({ fontFamily: MONO_FONT, fontWeight: 600, fontSize: { xs: 40, md: 56 }, lineHeight: 1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color: out ? t.palette.warning.light : digitColor, textShadow: `0 0 12px ${alpha(out ? t.palette.warning.light : digitColor, 0.45)}` })}>
              {value}
            </Typography>
            {unit && (
              <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 600, fontSize: { xs: 18, md: 26 }, lineHeight: 1, color: alpha('#cbd5e1', 0.8), whiteSpace: 'nowrap' }}>
                {unit}
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>
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

  // The kiosk renders outside the app shell, so it sets its own tab title.
  useEffect(() => { document.title = 'Monitor en vivo · Sistema de Control PLC'; }, []);

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 3, overflowX: 'hidden' }}>
      {/* Wrap on small screens so the title + status + clock + controls never push the page wider
          than the viewport (a full-screen monitor must never scroll horizontally). */}
      <Stack direction="row" useFlexGap spacing={{ xs: 1, sm: 2 }} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <ThermostatIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, minWidth: 0 }}>Monitor en vivo</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {/* Compact dot on phones; full badge with label from sm up. */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' } }}><SystemHealthBadge compact /></Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' } }}><SystemHealthBadge /></Box>
        <Typography variant="h6" sx={{ fontFamily: MONO_FONT, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', color: 'text.secondary' }}>
          {now.format('HH:mm:ss')}
        </Typography>
        <Tooltip title={isFs ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          <IconButton onClick={toggleFullscreen}>{isFs ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}</IconButton>
        </Tooltip>
        <Tooltip title="Salir del modo kiosco">
          <IconButton onClick={exit}><CloseRoundedIcon /></IconButton>
        </Tooltip>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <BigTile tag="TT-01" icon={<ThermostatIcon />} accent={theme.palette.primary.main} label="Temperatura"
            value={latest ? formatNumber(tempCount) : '—'} unit={latest ? '°C' : undefined} out={tempOut} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <BigTile tag="RH-01" icon={<WaterDropIcon />} accent={theme.palette.secondary.main} label="Humedad"
            value={latest ? formatNumber(humCount) : '—'} unit={latest ? '%' : undefined} out={humOut} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <BigTile tag="FAN-01" icon={<AcUnitIcon />} accent={latest?.coolerOn ? theme.palette.success.main : theme.palette.text.secondary}
            label="Cooler" value={latest ? (latest.coolerOn ? 'ON' : 'OFF') : '—'} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Box sx={(t) => ({
            height: '100%', borderRadius: 2, overflow: 'hidden',
            border: `1px solid ${t.palette.divider}`, bgcolor: 'background.paper',
          })}>
            <TileHeader tag="SYS" icon={<InsightsIcon />} label="Estado" accent={theme.palette.warning.main} />
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Box>{latest ? <StatusChip status={latest.status} /> : <Typography variant="h4" sx={{ fontFamily: MONO_FONT }}>—</Typography>}</Box>
              {config && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontFamily: MONO_FONT }}>
                  T {config.temperatureMin}–{config.temperatureMax} °C · H {config.humidityMin}–{config.humidityMax} %
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 1.5, md: 3 }, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Últimas 2 horas</Typography>
        {points.length > 0 ? (
          <AreaLineChart
            fill
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
