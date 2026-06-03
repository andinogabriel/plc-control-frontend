import {
  gridPageSelector,
  gridPageSizeSelector,
  gridRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from '@mui/x-data-grid';
import { MenuItem, Pagination, Select, Stack, Typography } from '@mui/material';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Custom DataGrid pagination:
 * - page-size options larger than the total row count are disabled (e.g. with 11 rows only
 *   10 and 20 are selectable);
 * - everything sits on a single row, which keeps it usable on mobile.
 */
export function DataTablePagination() {
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
      alignItems="center"
      justifyContent="space-between"
      sx={{ width: '100%', px: { xs: 1, sm: 2 }, py: 0.5, gap: 1 }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
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
    </Stack>
  );
}
