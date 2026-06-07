import { Box, Stack, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import type { ReactNode } from 'react';

/**
 * Illustrated empty-state: a soft circular icon badge plus a title, optional description and
 * action. Used for charts and tables that have no data to show.
 */
export function EmptyState({ icon, title, description, action, dense }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  dense?: boolean;
}) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.25}
      sx={{ height: '100%', minHeight: dense ? 120 : 180, textAlign: 'center', px: 2, py: dense ? 2 : 4 }}
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
