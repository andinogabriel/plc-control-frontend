import { Box } from '@mui/material';
import { DataGrid, type DataGridProps } from '@mui/x-data-grid';
import { DataTablePagination } from './DataTablePagination';
import { TableEmptyOverlay } from './TableEmptyOverlay';
import { HEADER_HEIGHT, ROW_HEIGHT, PAGE_SIZE_OPTIONS, dataGridHeight } from './dataGridLayout';

/**
 * Project-wide DataGrid wrapper: server pagination, fixed 10-row height with internal scroll,
 * the custom single-row pagination, and Spanish text (provided by the theme's esES locale).
 * `dense` switches to a compact row height (the 10-row height is recomputed to match).
 */
export function AppDataGrid({ dense, ...props }: DataGridProps & { dense?: boolean }) {
  const rowHeight = dense ? ROW_HEIGHT.compact : ROW_HEIGHT.standard;
  const gridHeight = dataGridHeight(dense);
  return (
    <Box sx={{ height: gridHeight, width: '100%' }}>
      <DataGrid
        rowHeight={rowHeight}
        columnHeaderHeight={HEADER_HEIGHT}
        paginationMode="server"
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        disableRowSelectionOnClick
        disableColumnMenu
        showCellVerticalBorder
        showColumnVerticalBorder
        {...props}
        slots={{ pagination: DataTablePagination, noRowsOverlay: () => <TableEmptyOverlay />, ...props.slots }}
        slotProps={{ loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' }, ...props.slotProps }}
        sx={{
          border: 0,
          // Subtle, mode-agnostic grid lines between rows and columns.
          '--DataGrid-rowBorderColor': 'rgba(128,128,128,0.20)',
          '& .MuiDataGrid-columnHeaders': { backgroundColor: 'action.hover' },
          '& .MuiDataGrid-columnHeader': {
            borderColor: 'rgba(128,128,128,0.20)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: 12,
          },
          '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
          '& .MuiDataGrid-cell': { borderColor: 'rgba(128,128,128,0.20)' },
          '& .MuiDataGrid-row': { cursor: props.onRowClick ? 'pointer' : 'default' },
          '& .MuiDataGrid-row:hover': { backgroundColor: 'action.hover' },
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          ...props.sx,
        }}
      />
    </Box>
  );
}
