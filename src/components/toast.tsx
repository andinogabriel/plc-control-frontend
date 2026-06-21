import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, IconButton, Snackbar, type AlertColor } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

type ShowToast = (message: string, severity?: AlertColor) => void;

const TOAST_ICON: Record<AlertColor, ReactNode> = {
  info: <InfoOutlinedIcon fontSize="small" />,
  success: <CheckCircleRoundedIcon fontSize="small" />,
  warning: <WarningAmberRoundedIcon fontSize="small" />,
  error: <ErrorOutlineRoundedIcon fontSize="small" />,
};

const ToastContext = createContext<ShowToast>(() => undefined);

/** Imperative toast trigger: `const toast = useToast(); toast('Guardado', 'success');` */
export const useToast = (): ShowToast => useContext(ToastContext);

// Module-level bridge so non-React code (e.g. the react-query cache) can raise toasts.
let externalHandler: ShowToast | null = null;
export function notifyToast(message: string, severity: AlertColor = 'info') {
  externalHandler?.(message, severity);
}

/**
 * App-wide snackbar provider. A single Snackbar is reused for every toast so they don't stack;
 * each call replaces the current message. Must live inside the ThemeProvider.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; severity: AlertColor }>({
    message: '', severity: 'info',
  });
  const [open, setOpen] = useState(false);

  const show = useCallback<ShowToast>((message, severity = 'info') => {
    setToast({ message, severity });
    setOpen(true);
  }, []);

  // Expose the trigger to module-level callers (query cache, etc.).
  useEffect(() => {
    externalHandler = show;
    return () => { if (externalHandler === show) externalHandler = null; };
  }, [show]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={(_e, reason) => { if (reason !== 'clickaway') setOpen(false); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        // Lift above the fixed mobile bottom-nav (~56px + iOS safe area); default spacing on md+.
        sx={{ bottom: { xs: 'calc(72px + env(safe-area-inset-bottom))', md: 24 } }}
      >
        {/* Solid "console" toast: a dark surface with a severity-coloured rule — not MUI's default
            filled Alert — so it reads like the rest of the instrument UI in both themes. */}
        <Box
          role="status"
          sx={(t) => ({
            display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 280, maxWidth: '92vw',
            px: 2, py: 1.25, borderRadius: 1,
            backgroundColor: '#1e293b',
            color: '#e5e7eb',
            borderLeft: `4px solid ${t.palette[toast.severity].main}`,
            boxShadow: '0 8px 24px rgba(2,6,23,0.45)',
          })}
        >
          <Box sx={(t) => ({ display: 'inline-flex', color: t.palette[toast.severity].main })}>
            {TOAST_ICON[toast.severity]}
          </Box>
          <Box sx={{ flex: 1, fontSize: 14, lineHeight: 1.4 }}>{toast.message}</Box>
          <IconButton size="small" onClick={() => setOpen(false)} aria-label="Cerrar" sx={{ color: 'inherit', opacity: 0.7, '&:hover': { opacity: 1 } }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
}
