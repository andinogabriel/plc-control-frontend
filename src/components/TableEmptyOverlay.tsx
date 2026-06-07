import { Button } from '@mui/material';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { EmptyState } from './EmptyState';

/**
 * Centered empty-state for the DataGrid. When the emptiness is caused by active filters it
 * offers a one-click way to clear them (otherwise the filter headers are disabled).
 */
export function TableEmptyOverlay({ hasFilters, onClear }: { hasFilters?: boolean; onClear?: () => void }) {
  return (
    <EmptyState
      icon={hasFilters ? <FilterAltOffOutlinedIcon sx={{ fontSize: 30 }} /> : <InboxOutlinedIcon sx={{ fontSize: 30 }} />}
      title={hasFilters ? 'Sin coincidencias' : 'No hay datos para mostrar'}
      description={hasFilters
        ? 'Ningún registro coincide con los filtros aplicados.'
        : 'Todavía no se registraron datos.'}
      action={hasFilters && onClear
        ? <Button size="small" variant="outlined" onClick={onClear}>Limpiar filtros</Button>
        : undefined}
    />
  );
}
