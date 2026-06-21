import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import type { ReactNode } from 'react';

/**
 * Empty-state: a squared, flat instrument-style icon tile plus a title, optional description and
 * action — matches the control-panel language instead of a soft illustrated badge. Used for charts
 * and tables with no data.
 */
export function EmptyState({ icon, title, description, action, dense, height, accent = 'primary' }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  dense?: boolean;
  /** Fixed height so a chart card keeps the same size whether or not it has data. */
  height?: number | string;
  /** Accent colour for the icon halo, so it matches its context (e.g. an error state). */
  accent?: 'primary' | 'error' | 'warning' | 'success' | 'info';
}) {
  return (
    <Stack
      spacing={1.25}
      sx={{ alignItems: 'center', justifyContent: 'center', height: height ?? '100%', minHeight: height ?? (dense ? 120 : 180), textAlign: 'center', px: 2, py: dense ? 2 : 4 }}
    >
      <Box sx={(t) => ({
        width: 46, height: 46, borderRadius: 1.5, display: 'grid', placeItems: 'center',
        color: t.palette[accent].main,
        // Flat squared tile with a hairline edge — same instrument language as the metric tiles.
        backgroundColor: alpha(t.palette[accent].main, 0.1),
        border: `1px solid ${alpha(t.palette[accent].main, 0.28)}`,
      })}>
        {icon ?? <InboxOutlinedIcon sx={{ fontSize: 24 }} />}
      </Box>
      <Typography variant="subtitle2" color="text.primary">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>{description}</Typography>
      )}
      {action}
    </Stack>
  );
}
