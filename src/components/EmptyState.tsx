import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import type { ReactNode } from 'react';

/**
 * Illustrated empty-state: a soft circular icon badge plus a title, optional description and
 * action. Used for charts and tables that have no data to show.
 */
export function EmptyState({ icon, title, description, action, dense, height }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  dense?: boolean;
  /** Fixed height so a chart card keeps the same size whether or not it has data. */
  height?: number | string;
}) {
  return (
    <Stack
      spacing={1.25}
      sx={{ alignItems: 'center', justifyContent: 'center', height: height ?? '100%', minHeight: height ?? (dense ? 120 : 180), textAlign: 'center', px: 2, py: dense ? 2 : 4 }}
    >
      <Box sx={(t) => ({
        width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center',
        color: alpha(t.palette.primary.main, 0.8),
        // Soft brand-tinted halo so the empty state reads as illustrated, not just greyed out.
        background: `radial-gradient(circle at 50% 38%, ${alpha(t.palette.primary.main, 0.18)}, ${alpha(t.palette.primary.main, 0.04)})`,
        border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
      })}>
        {icon ?? <InboxOutlinedIcon sx={{ fontSize: 30 }} />}
      </Box>
      <Typography variant="subtitle2" color="text.primary">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>{description}</Typography>
      )}
      {action}
    </Stack>
  );
}
