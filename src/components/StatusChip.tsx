import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';

type PaletteKey = 'success' | 'warning' | 'error' | 'default';

const colorMap: Record<string, PaletteKey> = {
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
  const key = colorMap[status] ?? 'default';
  return (
    <Chip
      label={labelMap[status] ?? status}
      size="small"
      sx={(theme) => {
        const main = key === 'default' ? theme.palette.text.secondary : theme.palette[key].main;
        return {
          fontWeight: 600,
          color: main,
          backgroundColor: alpha(main, 0.14),
          border: `1px solid ${alpha(main, 0.28)}`,
        };
      }}
    />
  );
}
