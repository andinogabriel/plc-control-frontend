import { useMediaQuery } from '@mui/material';

/** True when the user asked the OS to minimise motion; gate animations on this. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
