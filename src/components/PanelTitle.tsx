import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

type Accent = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

/**
 * Consistent panel header: a short accent tick followed by the title. Gives every card/section the
 * same "labelled module" look across the app instead of bare headings.
 */
export function PanelTitle({ children, accent = 'primary', sx }: {
  children: ReactNode;
  accent?: Accent;
  sx?: SxProps<Theme>;
}) {
  return (
    <Stack direction="row" spacing={1} sx={[{ alignItems: 'center', minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box sx={(t) => ({ width: 4, height: 18, borderRadius: 0.5, flexShrink: 0, backgroundColor: t.palette[accent].main })} />
      <Typography variant="subtitle1" noWrap>{children}</Typography>
    </Stack>
  );
}
