import { Chip } from '@mui/material';

const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  NORMAL: 'success',
  WARNING: 'warning',
  WARNING_TEMP: 'warning',
  WARNING_HUMIDITY: 'warning',
  CRITICAL: 'error',
  UNKNOWN: 'default',
};

// Spanish labels for display only; the underlying status value stays in English (code/API).
const labelMap: Record<string, string> = {
  NORMAL: 'Normal',
  WARNING: 'Alerta',
  WARNING_TEMP: 'Alerta temperatura',
  WARNING_HUMIDITY: 'Alerta humedad',
  CRITICAL: 'Crítico',
  UNKNOWN: 'Desconocido',
};

export function StatusChip({ status }: { status: string }) {
  return <Chip label={labelMap[status] ?? status} color={colorMap[status] ?? 'default'} size="small" />;
}
