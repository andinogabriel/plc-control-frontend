import { useCallback, useState } from 'react';

export type ViewMode = 'table' | 'cards';
const KEY = 'tableViewMode';

/** Persisted table/cards view preference (applies on desktop; phones always use cards). */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>(() => (localStorage.getItem(KEY) === 'cards' ? 'cards' : 'table'));
  const setMode = useCallback((next: ViewMode) => {
    localStorage.setItem(KEY, next);
    setModeState(next);
  }, []);
  return [mode, setMode];
}
