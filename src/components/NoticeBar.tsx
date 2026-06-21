import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import type { SxProps, Theme } from '@mui/material/styles';

type NoticeSeverity = 'info' | 'success' | 'warning' | 'error';

const PALETTE: Record<NoticeSeverity, 'info' | 'success' | 'warning' | 'error'> = {
  info: 'info', success: 'success', warning: 'warning', error: 'error',
};
const DEFAULT_ICON: Record<NoticeSeverity, ReactNode> = {
  info: <InfoOutlinedIcon />,
  success: <CheckCircleRoundedIcon />,
  warning: <WarningAmberRoundedIcon />,
  error: <ErrorOutlineRoundedIcon />,
};

/**
 * Instrument-styled inline notice — the bespoke replacement for MUI's default `Alert`. A flat bar
 * with a left accent rule, a tinted surface in the severity colour, a severity icon, the message,
 * and an optional action slot. Matches the control-panel language used across the app.
 */
export function NoticeBar({ severity = 'info', icon, action, square = false, children, sx }: {
  severity?: NoticeSeverity;
  icon?: ReactNode;
  action?: ReactNode;
  /** Square edges (e.g. a full-width banner under the AppBar). */
  square?: boolean;
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      role={severity === 'error' || severity === 'warning' ? 'alert' : 'status'}
      sx={[
        (t) => {
          const c = t.palette[PALETTE[severity]].main;
          return {
            display: 'flex', alignItems: 'center', gap: 1.25,
            px: 2, py: 1,
            borderRadius: square ? 0 : 1,
            border: `1px solid ${alpha(c, 0.4)}`,
            borderLeft: `4px solid ${c}`,
            backgroundColor: alpha(c, t.palette.mode === 'dark' ? 0.12 : 0.07),
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={(t) => ({ display: 'inline-flex', flexShrink: 0, color: t.palette[PALETTE[severity]].main, '& svg': { fontSize: 20 } })}>
        {icon ?? DEFAULT_ICON[severity]}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.5, color: 'text.primary' }}>{children}</Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
}
