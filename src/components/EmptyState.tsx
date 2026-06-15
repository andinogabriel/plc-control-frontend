import { Box, Stack, Typography } from '@mui/material';
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
      <Box sx={{
        width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center',
        bgcolor: 'action.hover', color: 'text.disabled',
      }}>
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
