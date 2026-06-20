import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

export type LampTone = 'success' | 'warning' | 'error' | 'info' | 'default';

/**
 * Indicator LED used across the panel UI (status bar, actuator rows, chips). Renders a small dot
 * that glows in its tone; `pulse` adds a slow breathing animation for live/active states (honours
 * reduced-motion). Resolves `default` to the muted text colour, everything else to its palette hue.
 */
export function StatusLamp({ tone = 'default', size = 9, pulse = false }: {
  tone?: LampTone;
  size?: number;
  pulse?: boolean;
}) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={(theme) => {
        const main = tone === 'default' ? theme.palette.text.disabled : theme.palette[tone].main;
        return {
          width: size,
          height: size,
          borderRadius: '50%',
          flexShrink: 0,
          backgroundColor: main,
          // Soft halo so the dot reads as an emitting LED rather than a flat circle.
          boxShadow: `0 0 ${size * 0.9}px ${alpha(main, 0.85)}, 0 0 2px ${alpha(main, 0.6)}`,
          '@keyframes lampPulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.4 },
          },
          animation: pulse ? 'lampPulse 1.8s ease-in-out infinite' : 'none',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        };
      }}
    />
  );
}
