import { Button } from '@mui/material';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { EmptyState } from './EmptyState';

/**
 * Friendly error state for a failed query (e.g. a backend 500), with a retry action. Reuses the
 * EmptyState layout with an error icon.
 */
export function ErrorState({ title = 'No se pudieron cargar los datos', description, onRetry, dense, height }: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  dense?: boolean;
  height?: number | string;
}) {
  return (
    <EmptyState
      dense={dense}
      height={height}
      accent="error"
      icon={<CloudOffRoundedIcon sx={{ fontSize: 30 }} color="error" />}
      title={title}
      description={description ?? 'Hubo un problema al consultar el servidor. Probá de nuevo en unos segundos.'}
      action={onRetry && (
        <Button size="small" variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={onRetry}>
          Reintentar
        </Button>
      )}
    />
  );
}
