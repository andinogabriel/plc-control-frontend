import {
  gridPageSelector,
  gridPageSizeSelector,
  gridRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from '@mui/x-data-grid';
import {
  IconButton, MenuItem, Pagination, Select, Stack, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { PAGE_SIZE_OPTIONS } from './dataGridLayout';

/**
 * Custom DataGrid pagination:
 * - page-size options larger than the total row count are disabled (e.g. with 11 rows only
 *   10 and 20 are selectable);
 * - on desktop a full numbered pager; on mobile a compact prev / "X de Y" / next that never
 *   wraps to a second row.
 */
export function DataTablePagination() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector);
  const rowCount = useGridSelector(apiRef, gridRowCountSelector);

  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize));
  const fromRow = rowCount === 0 ? 0 : page * pageSize + 1;
  const toRow = Math.min(rowCount, (page + 1) * pageSize);

  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%', px: { xs: 1, sm: 2 }, py: 0.5, gap: 1 }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          Filas:
        </Typography>
        <Select
          size="small"
          value={pageSize}
          onChange={(e) => apiRef.current.setPageSize(Number(e.target.value))}
          sx={{ '& .MuiSelect-select': { py: 0.5 } }}
        >
          {PAGE_SIZE_OPTIONS.map((opt, i) => {
            const previous = i === 0 ? 0 : PAGE_SIZE_OPTIONS[i - 1];
            // Enable an option only if a smaller one does not already cover every row.
            const disabled = previous >= rowCount && opt !== pageSize;
            return (
              <MenuItem key={opt} value={opt} disabled={disabled}>
                {opt}
              </MenuItem>
            );
          })}
        </Select>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
        {fromRow}–{toRow} de {rowCount}
      </Typography>

      {isMobile ? (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <IconButton size="small" aria-label="Página anterior"
            disabled={page <= 0} onClick={() => apiRef.current.setPage(page - 1)}>
            <ChevronLeftRoundedIcon />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 64, textAlign: 'center' }}>
            {page + 1} de {pageCount}
          </Typography>
          <IconButton size="small" aria-label="Página siguiente"
            disabled={page + 1 >= pageCount} onClick={() => apiRef.current.setPage(page + 1)}>
            <ChevronRightRoundedIcon />
          </IconButton>
        </Stack>
      ) : (
        <Pagination
          color="primary"
          shape="rounded"
          size="small"
          count={pageCount}
          page={page + 1}
          siblingCount={0}
          boundaryCount={1}
          showFirstButton
          showLastButton
          onChange={(_, value) => apiRef.current.setPage(value - 1)}
        />
      )}
    </Stack>
  );
}
