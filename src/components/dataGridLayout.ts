// Shared layout constants for the project DataGrid. Kept in their own (non-component) module so
// AppDataGrid stays a component-only file (React Fast Refresh) while pages that replace the table
// with an empty/error state can reserve the same height via dataGridHeight().

export const HEADER_HEIGHT = 56;
const FOOTER_HEIGHT = 56;
const VISIBLE_ROWS = 10;
export const ROW_HEIGHT = { standard: 52, compact: 40 } as const;

/** Fixed height of the grid (10 rows + header + footer), so empty/error states match the table. */
export const dataGridHeight = (dense?: boolean) =>
  HEADER_HEIGHT + (dense ? ROW_HEIGHT.compact : ROW_HEIGHT.standard) * VISIBLE_ROWS + FOOTER_HEIGHT;
