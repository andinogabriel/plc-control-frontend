import { createTheme, type Theme } from '@mui/material/styles';
import { esES as coreEsES } from '@mui/material/locale';
import { esES as dataGridEsES } from '@mui/x-data-grid/locales';

/** Builds the app theme for the given palette mode (light/dark), with Spanish locales. */
export function createAppTheme(mode: 'light' | 'dark'): Theme {
  const isLight = mode === 'light';
  return createTheme(
    {
      palette: {
        mode,
        primary: { main: '#2563eb' },
        secondary: { main: '#0d9488' },
        background: isLight
          ? { default: '#f1f5f9', paper: '#ffffff' }
          : { default: '#0f172a', paper: '#1e293b' },
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 600 },
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: ({ theme }) => ({
              borderRadius: 16,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
            }),
          },
        },
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: { root: { borderRadius: 10, textTransform: 'none', fontWeight: 600 } },
        },
        MuiAppBar: {
          styleOverrides: { root: { boxShadow: '0 1px 2px rgba(15,23,42,0.12)' } },
        },
      },
    },
    coreEsES,
    dataGridEsES,
  );
}
