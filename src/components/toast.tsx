import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar, type AlertColor } from '@mui/material';

type ShowToast = (message: string, severity?: AlertColor) => void;

const ToastContext = createContext<ShowToast>(() => undefined);

/** Imperative toast trigger: `const toast = useToast(); toast('Guardado', 'success');` */
export const useToast = (): ShowToast => useContext(ToastContext);

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

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={(_e, reason) => { if (reason !== 'clickaway') setOpen(false); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setOpen(false)}
          sx={{ boxShadow: 6, alignItems: 'center' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
