import { useEffect, useRef } from 'react';
import { Alert, Collapse } from '@mui/material';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import { useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Thin banner under the AppBar shown while the browser is offline. On reconnection it refetches
 * the active queries so the UI catches up immediately.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) { wasOffline.current = true; return; }
    if (wasOffline.current) {
      wasOffline.current = false;
      queryClient.invalidateQueries();
    }
  }, [online, queryClient]);

  return (
    <Collapse in={!online} unmountOnExit>
      <Alert severity="warning" icon={<WifiOffRoundedIcon />} square sx={{ borderRadius: 0 }}>
        Sin conexión a internet. Los datos pueden estar desactualizados; se actualizarán al reconectar.
      </Alert>
    </Collapse>
  );
}
