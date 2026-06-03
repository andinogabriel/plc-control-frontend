import { Box } from '@mui/material';
import { DataGrid, type DataGridProps } from '@mui/x-data-grid';
import { DataTablePagination, PAGE_SIZE_OPTIONS } from './DataTablePagination';
import { TableEmptyOverlay } from './TableEmptyOverlay';

const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 56;
const FOOTER_HEIGHT = 56;
const VISIBLE_ROWS = 10;

// The grid keeps the height of ~10 rows regardless of page size; larger pages scroll inside.
const GRID_HEIGHT = HEADER_HEIGHT + ROW_HEIGHT * VISIBLE_ROWS + FOOTER_HEIGHT;

/**
 * Project-wide DataGrid wrapper: server pagination, fixed 10-row height with internal scroll,
 * the custom single-row pagination, and Spanish text (provided by the theme's esES locale).
 */
export function AppDataGrid(props: DataGridProps) {
  return (
    <Box sx={{ height: GRID_HEIGHT, width: '100%' }}>
      <DataGrid
        rowHeight={ROW_HEIGHT}
        columnHeaderHeight={HEADER_HEIGHT}
        paginationMode="server"
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        disableRowSelectionOnClick
        disableColumnMenu
        showCellVerticalBorder
        showColumnVerticalBorder
        {...props}
        slots={{ pagination: DataTablePagination, noRowsOverlay: () => <TableEmptyOverlay />, ...props.slots }}
        sx={{
          // Subtle, mode-agnostic grid lines between rows and columns.
          '--DataGrid-rowBorderColor': 'rgba(128,128,128,0.22)',
          '& .MuiDataGrid-columnHeaders': { backgroundColor: 'action.hover' },
          '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
          '& .MuiDataGrid-cell': { borderColor: 'rgba(128,128,128,0.22)' },
          '& .MuiDataGrid-columnHeader': { borderColor: 'rgba(128,128,128,0.22)' },
          '& .MuiDataGrid-row:hover': { backgroundColor: 'action.hover' },
          ...props.sx,
        }}
      />
    </Box>
  );
}
