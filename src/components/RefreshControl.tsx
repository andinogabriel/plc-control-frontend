import { useEffect, useState } from 'react';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

function formatAgo(seconds: number): string {
  if (seconds < 5) return 'hace un momento';
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  return `hace ${Math.floor(minutes / 60)} h`;
}

/**
 * Live "updated X ago" label plus a pause/resume toggle for auto-refreshing views. The label
 * re-renders every second from {@code lastUpdated} (a timestamp in ms); pausing is owned by the
 * parent so it can stop the underlying query's refetch interval.
 */
export function RefreshControl({ lastUpdated, paused, onToggle }: {
  lastUpdated?: number;
  paused: boolean;
  onToggle: () => void;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const ago = lastUpdated ? Math.max(0, Math.round((Date.now() - lastUpdated) / 1000)) : null;
  const label = paused
    ? 'Actualización en pausa'
    : ago == null ? 'Actualizando…' : `Actualizado ${formatAgo(ago)}`;

  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {!paused && (
        <Box sx={{
          width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main',
          boxShadow: (t) => `0 0 0 3px ${t.palette.success.main}22`,
        }} />
      )}
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Tooltip title={paused ? 'Reanudar actualización' : 'Pausar actualización'}>
        <IconButton size="small" onClick={onToggle} aria-label={paused ? 'Reanudar' : 'Pausar'}>
          {paused ? <PlayArrowRoundedIcon fontSize="small" /> : <PauseRoundedIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
