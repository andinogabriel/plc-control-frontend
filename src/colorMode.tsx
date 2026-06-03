import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { createAppTheme } from './theme';

export type ColorMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'colorMode';

const ColorModeContext = createContext<{ mode: ColorMode; setMode: (m: ColorMode) => void }>({
  mode: 'system',
  setMode: () => undefined,
});

export const useColorMode = () => useContext(ColorModeContext);

/** Provides the theme with a persisted light/dark/system selection. */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(
    () => (localStorage.getItem(STORAGE_KEY) as ColorMode) || 'system',
  );
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, mode); }, [mode]);

  const resolved: 'light' | 'dark' = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
  const theme = useMemo(() => createAppTheme(resolved), [resolved]);

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
