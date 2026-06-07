import { useCallback, useState } from 'react';

const KEY = 'tableDensity';

/** Persisted compact/standard table density preference, shared across the table pages. */
export function useDensity(): [boolean, () => void] {
  const [dense, setDense] = useState<boolean>(() => localStorage.getItem(KEY) === 'compact');
  const toggle = useCallback(() => {
    setDense((d) => {
      const next = !d;
      localStorage.setItem(KEY, next ? 'compact' : 'standard');
      return next;
    });
  }, []);
  return [dense, toggle];
}
