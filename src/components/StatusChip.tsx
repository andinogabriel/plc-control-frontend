import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { StatusLamp, type LampTone } from './StatusLamp';

type PaletteKey = LampTone;

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
  // Warning/critical states pulse so a problem draws the eye on the panel.
  const pulse = key === 'warning' || key === 'error';
  return (
    <Chip
      label={labelMap[status] ?? status}
      size="small"
      icon={<StatusLamp tone={key} pulse={pulse} />}
      sx={(theme) => {
        const main = key === 'default' ? theme.palette.text.secondary : theme.palette[key].main;
        return {
          fontWeight: 600,
          borderRadius: 1,
          letterSpacing: '0.04em',
          color: main,
          backgroundColor: alpha(main, 0.12),
          border: `1px solid ${alpha(main, 0.3)}`,
          // The lamp brings its own colour/glow; keep the chip's icon slot from tinting it.
          '& .MuiChip-icon': { color: 'inherit', ml: 0.75, mr: -0.25 },
        };
      }}
    />
  );
}
