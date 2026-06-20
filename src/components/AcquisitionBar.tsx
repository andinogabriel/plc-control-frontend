import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSystemHealth, type HealthStatus } from '../hooks/useSystemHealth';
import { formatRelative } from '../lib/time';
import { StatusLamp, type LampTone } from './StatusLamp';
import { MONO_FONT } from '../theme';

const STATE: Record<HealthStatus, { label: string; tone: LampTone }> = {
  online: { label: 'ADQUIRIENDO', tone: 'success' },
  delayed: { label: 'DEMORA', tone: 'warning' },
  offline: { label: 'DETENIDO', tone: 'error' },
  unknown: { label: 'SIN DATOS', tone: 'default' },
};

/** A muted mono label + value pair, e.g. "ESTACIÓN  EST-01". */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline' }}>
      <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 10.5, letterSpacing: '0.08em', color: 'text.disabled' }}>{label}</Typography>
      <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>{value}</Typography>
    </Stack>
  );
}

/**
 * Data-logger identity strip under the app header: station tag, acquisition state (a lamp + label
 * driven by sensor health), and the last sample time. Reads like a DAQ console rather than a web
 * app chrome. Hidden when printing.
 */
export function AcquisitionBar() {
  const { status, lastAt } = useSystemHealth();
  const s = STATE[status];
  return (
    <Box className="no-print" sx={(t) => ({
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2.5 },
      px: 1.5, py: 0.65, mb: 1.5, borderRadius: 1,
      border: `1px solid ${t.palette.divider}`,
      backgroundColor: alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.03 : 0.02),
    })}>
      <Field label="ESTACIÓN" value="EST-01" />
      <Box sx={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'divider', display: { xs: 'none', sm: 'block' } }} />
      <Stack direction="row" spacing={0.85} sx={{ alignItems: 'center' }}>
        <StatusLamp tone={s.tone} size={8} pulse={status === 'online'} />
        <Typography component="span" sx={(t) => ({ fontFamily: MONO_FONT, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: s.tone === 'default' ? t.palette.text.secondary : t.palette[s.tone].main })}>
          {s.label}
        </Typography>
      </Stack>
      <Box sx={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'divider', display: { xs: 'none', sm: 'block' } }} />
      <Field label="ÚLT. MUESTREO" value={lastAt ? formatRelative(lastAt) : '—'} />
    </Box>
  );
}
