import type { ReactNode } from 'react';
import { Box, Divider, Drawer, Stack, Typography } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';

/**
 * On phones the DataGrid (and its filter/sort headers) is hidden in favour of the card list, so
 * this bottom sheet re-exposes those same column headers stacked vertically: tap a title to sort
 * or its funnel to filter (each opens its own bottom sheet). Reuses the exact column headers, so
 * there is no duplicated filter logic.
 */
export function MobileFilterSheet({ open, onClose, columns }: {
  open: boolean; onClose: () => void; columns: GridColDef[];
}) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, pb: 'env(safe-area-inset-bottom)' } } }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Filtros y orden</Typography>
        <Stack divider={<Divider flexItem />}>
          {columns.map((c) => (
            <Box key={c.field} sx={{ py: 1.25, display: 'flex', justifyContent: 'center' }}>
              {c.renderHeader ? (c.renderHeader as () => ReactNode)() : c.headerName}
            </Box>
          ))}
        </Stack>
      </Box>
    </Drawer>
  );
}
