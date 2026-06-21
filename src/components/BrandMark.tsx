import { Box } from '@mui/material';

/**
 * App brand mark: a copper badge with a gauge arc and a cyan needle — echoes the RadialGauge that
 * is the system's signature element, so the identity is bespoke rather than a stock MUI icon.
 */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <Box component="svg" viewBox="0 0 28 28" sx={{ width: size, height: size, display: 'block', flexShrink: 0 }}
      role="img" aria-label="Sistema de Control PLC">
      <rect width="28" height="28" rx="7" fill="#c2410c" />
      <path d="M6.5 18.5 A7.5 7.5 0 0 1 21.5 18.5" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.92" />
      <line x1="14" y1="18.5" x2="18.4" y2="11.8" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="18.5" r="1.9" fill="#ffffff" />
    </Box>
  );
}
