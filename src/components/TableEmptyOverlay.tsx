import { Button, Stack, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

/**
 * Centered empty-state for the DataGrid. When the emptiness is caused by active filters it
 * offers a one-click way to clear them (otherwise the filter headers are disabled).
 */
export function TableEmptyOverlay({ hasFilters, onClear }: { hasFilters?: boolean; onClear?: () => void }) {
  return (
    <Stack height="100%" alignItems="center" justifyContent="center" spacing={1.5} sx={{ p: 2 }}>
      <InboxOutlinedIcon sx={{ fontSize: 40 }} color="disabled" />
      <Typography color="text.secondary">
        {hasFilters ? 'No hay datos que coincidan con el filtro' : 'No hay datos para mostrar'}
      </Typography>
      {hasFilters && onClear && (
        <Button size="small" variant="outlined" onClick={onClear}>Limpiar filtros</Button>
      )}
    </Stack>
  );
}
