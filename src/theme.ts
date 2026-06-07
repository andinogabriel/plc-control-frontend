import { alpha, createTheme, type Theme } from '@mui/material/styles';
import { esES as coreEsES } from '@mui/material/locale';
import { esES as dataGridEsES } from '@mui/x-data-grid/locales';

/** Builds the app theme for the given palette mode (light/dark), with Spanish locales. */
export function createAppTheme(mode: 'light' | 'dark'): Theme {
  const isLight = mode === 'light';

  const base = createTheme({
    palette: {
      mode,
      primary: { main: '#4f46e5', light: '#6366f1', dark: '#4338ca' },
      secondary: { main: '#0d9488' },
      success: { main: '#16a34a' },
      warning: { main: '#d97706' },
      error: { main: '#dc2626' },
      background: isLight
        ? { default: '#f6f7fb', paper: '#ffffff' }
        : { default: '#0b1120', paper: '#111827' },
      text: isLight
        ? { primary: '#0f172a', secondary: '#64748b' }
        : { primary: '#e5e7eb', secondary: '#94a3b8' },
      divider: isLight ? '#e6e8ee' : 'rgba(148,163,184,0.16)',
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.6 },
      caption: { lineHeight: 1.5 },
      overline: { letterSpacing: '0.08em', fontWeight: 600 },
    },
  });

  const softShadow = isLight
    ? '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)'
    : '0 1px 2px rgba(0,0,0,0.4)';

  return createTheme(
    base,
    {
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            // Visible keyboard focus across the app (mouse clicks stay clean via :focus-visible).
            '*:focus-visible': {
              outline: `2px solid ${base.palette.primary.main}`,
              outlineOffset: 2,
              borderRadius: 4,
            },
          },
        },
        MuiCardActionArea: {
          styleOverrides: {
            root: {
              transition: base.transitions.create(['box-shadow', 'transform'], { duration: 150 }),
              '@media (hover: hover)': {
                '&:hover': { transform: 'translateY(-2px)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
                '&:hover': { transform: 'none' },
              },
            },
          },
        },
        MuiAppBar: {
          defaultProps: { color: 'default', elevation: 0 },
          styleOverrides: {
            root: {
              backgroundColor: alpha(base.palette.background.paper, isLight ? 0.8 : 0.7),
              backdropFilter: 'blur(8px)',
              color: base.palette.text.primary,
              borderBottom: `1px solid ${base.palette.divider}`,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: base.palette.background.paper,
              borderRight: `1px solid ${base.palette.divider}`,
              backgroundImage: 'none',
            },
          },
        },
        MuiCard: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            root: {
              borderRadius: 16,
              border: `1px solid ${base.palette.divider}`,
              boxShadow: softShadow,
              backgroundImage: 'none',
            },
          },
        },
        MuiPaper: {
          styleOverrides: { root: { backgroundImage: 'none' } },
        },
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: {
            root: { borderRadius: 10, textTransform: 'none', fontWeight: 600, paddingInline: 16 },
            containedPrimary: {
              boxShadow: 'none',
              '&:hover': { boxShadow: `0 4px 12px ${alpha(base.palette.primary.main, 0.35)}` },
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              '&.Mui-selected': {
                backgroundColor: alpha(base.palette.primary.main, 0.12),
                color: base.palette.primary.main,
                '& .MuiListItemIcon-root': { color: base.palette.primary.main },
                '&:hover': { backgroundColor: alpha(base.palette.primary.main, 0.18) },
              },
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: { root: { borderRadius: 10 } },
        },
        MuiChip: {
          styleOverrides: { root: { fontWeight: 600 } },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: { borderRadius: 8, fontSize: 12, backgroundColor: alpha('#0f172a', 0.92) },
          },
        },
      },
    },
    coreEsES,
    dataGridEsES,
  );
}
