import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { eventApi } from '../api/eventApi';
import { useSystemHealth, type HealthStatus } from '../hooks/useSystemHealth';
import { StatusLamp, type LampTone } from './StatusLamp';
import { MONO_FONT } from '../theme';

const CONN: Record<HealthStatus, { label: string; tone: LampTone }> = {
  online: { label: 'EN LÍNEA', tone: 'success' },
  delayed: { label: 'DEMORA', tone: 'warning' },
  offline: { label: 'SIN CONEXIÓN', tone: 'error' },
  unknown: { label: 'SIN DATOS', tone: 'default' },
};

function Cell({ children, color = 'text.secondary' }: { children: React.ReactNode; color?: string }) {
  return (
    <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 11, letterSpacing: '0.04em', color }}>
      {children}
    </Typography>
  );
}

const Sep = () => <Box component="span" sx={{ width: '1px', height: 12, backgroundColor: 'divider' }} />;

/**
 * Persistent SCADA-style status bar pinned to the bottom on desktop: station + mode on the left,
 * connection / unacknowledged alarms / clock on the right. A control-room habit that reinforces the
 * system identity. Hidden on phones, where the bottom navigation lives instead.
 */
export function StatusBar({ left = 0 }: { left?: number }) {
  const { status } = useSystemHealth();
  const conn = CONN[status];
  const { data: unacked = 0 } = useQuery({
    queryKey: ['events-unacked'],
    queryFn: () => eventApi.getUnacknowledgedCount(),
    refetchInterval: 30000,
  });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Box
      component="footer"
      className="no-print"
      sx={(t) => ({
        display: { xs: 'none', md: 'flex' },
        position: 'fixed', bottom: 0, right: 0, left: `${left}px`,
        alignItems: 'center', justifyContent: 'space-between', gap: 2,
        height: 28, px: 2, zIndex: t.zIndex.drawer - 1,
        borderTop: `1px solid ${t.palette.divider}`,
        backgroundColor: t.palette.background.paper,
        transition: t.transitions.create('left'),
      })}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Cell><Box component="span" sx={{ color: 'text.disabled', mr: 0.5 }}>EST</Box>EST-01</Cell>
        <Sep />
        <Cell><Box component="span" sx={{ color: 'text.disabled', mr: 0.5 }}>MODO</Box>AUTO</Cell>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <StatusLamp tone={conn.tone} size={7} pulse={status === 'online'} />
          <Cell color={conn.tone === 'default' ? 'text.secondary' : `${conn.tone}.main`}>{conn.label}</Cell>
        </Stack>
        <Sep />
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <StatusLamp tone={unacked > 0 ? 'error' : 'success'} size={7} pulse={unacked > 0} />
          <Cell color={unacked > 0 ? 'error.main' : 'text.secondary'}>
            {unacked > 0 ? `${unacked} ALARMAS` : 'SIN ALARMAS'}
          </Cell>
        </Stack>
        <Sep />
        <Cell><Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>{now.toLocaleTimeString('es-AR', { hour12: false })}</Box></Cell>
      </Stack>
    </Box>
  );
}
