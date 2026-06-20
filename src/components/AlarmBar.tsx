import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { StatusLamp } from './StatusLamp';
import { MONO_FONT } from '../theme';

/**
 * HMI-style alarm banner: a coloured bar with a pulsing lamp, a severity tag, the message and an
 * optional timestamp — reads like a control-room annunciator rather than a generic toast/alert.
 */
export function AlarmBar({ severity, message, time }: {
  severity: 'error' | 'warning';
  message: string;
  time?: string;
}) {
  return (
    <Box role="alert" sx={(t) => ({
      display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, mb: 2, borderRadius: 1,
      border: `1px solid ${alpha(t.palette[severity].main, 0.5)}`,
      borderLeft: `4px solid ${t.palette[severity].main}`,
      backgroundColor: alpha(t.palette[severity].main, t.palette.mode === 'dark' ? 0.12 : 0.08),
    })}>
      <StatusLamp tone={severity} size={12} pulse />
      <Typography component="span" sx={(t) => ({ fontFamily: MONO_FONT, fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', color: t.palette[severity].main })}>
        {severity === 'error' ? 'ALARMA' : 'AVISO'}
      </Typography>
      <Typography component="span" sx={{ flex: 1, fontSize: 14, color: 'text.primary' }}>{message}</Typography>
      {time && (
        <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
          {time}
        </Typography>
      )}
    </Box>
  );
}
