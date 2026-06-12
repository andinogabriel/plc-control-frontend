import { Box } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * Fades its children in on mount — used where content replaces a loading skeleton so it eases in
 * instead of popping. The animation runs once (it only fires when the element first mounts, i.e.
 * when the data arrives) and is disabled under prefers-reduced-motion.
 */
export function FadeIn({ children, duration = 350 }: { children: ReactNode; duration?: number }) {
  return (
    <Box sx={{
      '@keyframes contentFadeIn': {
        from: { opacity: 0, transform: 'translateY(4px)' },
        to: { opacity: 1, transform: 'none' },
      },
      animation: `contentFadeIn ${duration}ms ease both`,
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    }}>
      {children}
    </Box>
  );
}
