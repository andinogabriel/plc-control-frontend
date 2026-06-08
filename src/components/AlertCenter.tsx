import { useState } from 'react';
import {
  Badge, Box, Button, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText,
  Popover, Stack, Tooltip, Typography,
} from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAlerts, type AlertSeverity } from '../alerts';
import { formatRelative } from '../lib/time';

const ICON: Record<AlertSeverity, React.ReactNode> = {
  error: <ErrorOutlineRoundedIcon color="error" fontSize="small" />,
  warning: <WarningAmberRoundedIcon color="warning" fontSize="small" />,
  info: <InfoOutlinedIcon color="info" fontSize="small" />,
};

/** AppBar bell with an unread badge and a popover listing recent operational alerts. */
export function AlertCenter() {
  const { events, unread, markRead, clear } = useAlerts();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const canAskPermission = typeof Notification !== 'undefined' && Notification.permission === 'default';

  const open = (e: React.MouseEvent<HTMLElement>) => { setAnchor(e.currentTarget); markRead(); };

  return (
    <>
      <Tooltip title="Alertas">
        <IconButton color="inherit" onClick={open} aria-label={`Alertas${unread ? ` (${unread} sin leer)` : ''}`}>
          <Badge badgeContent={unread} color="error">
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2">Alertas</Typography>
          {events.length > 0 && <Button size="small" onClick={clear}>Limpiar</Button>}
        </Stack>
        <Divider />
        {events.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
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
