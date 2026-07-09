import { useState } from 'react';
import {
  Badge, Box, Button, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText,
  Popover, Stack, Tooltip, Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { eventApi } from '../api/eventApi';
import { useAlerts, type AlertSeverity } from '../alerts';
import { formatRelative } from '../lib/time';

const ICON: Record<AlertSeverity, React.ReactNode> = {
  error: <ErrorOutlineRoundedIcon color="error" fontSize="small" />,
  warning: <WarningAmberRoundedIcon color="warning" fontSize="small" />,
  info: <InfoOutlinedIcon color="info" fontSize="small" />,
};

/**
 * AppBar bell. The badge shows the SERVER-SIDE unacknowledged-alarm count — the same number as
 * the tab title, favicon dot and bottom status bar — so every red counter in the app agrees
 * (it previously showed session-local unread alerts, which made the bell disagree with the rest).
 * It clears through ACK in the events panel, not by opening this popover. The popover itself
 * still lists the recent session alerts, plus a shortcut to the alarm log when ACKs are pending.
 */
export function AlertCenter() {
  const { events, markRead, clear } = useAlerts();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();
  const canAskPermission = typeof Notification !== 'undefined' && Notification.permission === 'default';

  // Same query key as Layout's tab-title/favicon counter: shared cache, no extra request.
  const { data: unacked = 0 } = useQuery({
    queryKey: ['events-unacked'],
    queryFn: () => eventApi.getUnacknowledgedCount(),
    refetchInterval: 30000,
  });

  const open = (e: React.MouseEvent<HTMLElement>) => { setAnchor(e.currentTarget); markRead(); };
  const goToAlarms = () => { setAnchor(null); navigate('/tablero'); };

  return (
    <>
      <Tooltip title={unacked > 0 ? `${unacked} alarmas sin reconocer` : 'Alertas'}>
        <IconButton color="inherit" onClick={open} aria-label={`Alertas${unacked ? ` (${unacked} alarmas sin reconocer)` : ''}`}>
          <Badge badgeContent={unacked} color="error">
            <NotificationsRoundedIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, maxWidth: '92vw' } } }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25 }}>
          <Typography variant="subtitle2">Alertas</Typography>
          {events.length > 0 && <Button size="small" onClick={clear}>Limpiar</Button>}
        </Stack>
        {unacked > 0 && (
          <>
            <Divider />
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <WarningAmberRoundedIcon color="error" fontSize="small" />
                <Typography variant="body2">
                  {unacked === 1 ? '1 alarma sin reconocer' : `${unacked} alarmas sin reconocer`}
                </Typography>
              </Stack>
              <Button size="small" onClick={goToAlarms}>Ver alarmas</Button>
            </Stack>
          </>
        )}
        <Divider />
        {events.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 32, color: 'success.main', opacity: 0.55, mb: 0.5 }} />
            <Typography variant="body2">Sin alertas. Todo en orden.</Typography>
          </Box>
        ) : (
          <List dense sx={{ maxHeight: 360, overflowY: 'auto', py: 0 }}>
            {events.map((ev) => (
              <ListItem key={ev.id} alignItems="flex-start">
                <ListItemIcon sx={{ minWidth: 34, mt: 0.5 }}>{ICON[ev.severity]}</ListItemIcon>
                <ListItemText primary={ev.message} secondary={formatRelative(ev.time)} />
              </ListItem>
            ))}
          </List>
        )}
        {canAskPermission && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button fullWidth size="small" onClick={() => Notification.requestPermission()}>
                Activar notificaciones del navegador
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
}
