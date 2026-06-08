import { Box, Chip, Tooltip } from '@mui/material';
import { useSystemHealth, type HealthStatus } from '../hooks/useSystemHealth';
import { formatRelative } from '../lib/time';

const META: Record<HealthStatus, { label: string; color: string }> = {
  online: { label: 'En línea', color: '#16a34a' },
  delayed: { label: 'Demorado', color: '#d97706' },
  offline: { label: 'Sin conexión', color: '#dc2626' },
  unknown: { label: 'Sin datos', color: '#94a3b8' },
};

/**
 * "Is the sensor reporting?" indicator for the AppBar: a pulsing colour dot plus a label, with
 * a tooltip showing when the last measurement arrived. The `compact` variant renders just the
 * dot (used on phones, where AppBar space is tight).
 */
export function SystemHealthBadge({ compact }: { compact?: boolean }) {
  const { status, lastAt } = useSystemHealth();
  const meta = META[status];
  const tooltip = lastAt
    ? `${meta.label} · última medición ${formatRelative(lastAt)}`
    : `${meta.label} · todavía no llegaron mediciones`;

  const dot = (
    <Box component="span" sx={{
      width: 11, height: 11, borderRadius: '50%', bgcolor: meta.color,
      boxShadow: `0 0 0 3px ${meta.color}33`,
      animation: status === 'online' ? 'plcPulse 2s ease-in-out infinite' : 'none',
      '@keyframes plcPulse': {
        '0%,100%': { boxShadow: `0 0 0 0 ${meta.color}55` },
        '50%': { boxShadow: `0 0 0 4px ${meta.color}11` },
      },
    }} />
  );

  if (compact) {
    return (
      <Tooltip title={tooltip}>
        <Box role="status" aria-live="polite" aria-label={`Estado del sistema: ${meta.label}`}
          sx={{ display: 'grid', placeItems: 'center', width: 36, height: 36 }}>{dot}</Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltip}>
      <Chip
        size="small"
        variant="outlined"
        role="status"
        aria-live="polite"
        aria-label={`Estado del sistema: ${meta.label}`}
        label={meta.label}
        icon={(
          <Box component="span" sx={{
            width: 9, height: 9, borderRadius: '50%', bgcolor: meta.color, ml: 1,
            boxShadow: `0 0 0 3px ${meta.color}33`,
            animation: status === 'online' ? 'plcPulse 2s ease-in-out infinite' : 'none',
            '@keyframes plcPulse': {
              '0%,100%': { boxShadow: `0 0 0 0 ${meta.color}55` },
              '50%': { boxShadow: `0 0 0 4px ${meta.color}11` },
            },
          }} />
        )}
        sx={{ fontWeight: 600, '& .MuiChip-label': { pl: 1 } }}
      />
    </Tooltip>
  );
}
