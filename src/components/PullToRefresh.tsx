import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

const THRESHOLD = 70; // px of pull needed to trigger a refresh
const MAX = 110;

/**
 * Pull-to-refresh for touch devices: pulling down at the top of the page reveals a spinner and,
 * past a threshold, refetches all active queries. No-op with a fine pointer (desktop).
 */
export function PullToRefresh({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  const setPullBoth = (v: number) => { pullRef.current = v; setPull(v); };

  useEffect(() => {
    // Touch events only fire from touch input, so binding them everywhere is harmless on
    // desktop and avoids unreliable pointer/media gating on hybrid devices.
    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current || window.scrollY > 0 || e.touches.length !== 1) { active.current = false; return; }
      startY.current = e.touches[0].clientY;
      active.current = true;
    };
    const onMove = (e: TouchEvent) => {
      if (!active.current || startY.current == null || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY <= 0) {
        setPullBoth(Math.min(MAX, dy * 0.5)); // resistance
        if (pullRef.current > 5 && e.cancelable) e.preventDefault();
      } else if (pullRef.current !== 0) {
        setPullBoth(0);
      }
    };
    const onEnd = () => {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullBoth(THRESHOLD);
        queryClient.invalidateQueries().finally(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullBoth(0);
        });
      } else {
        setPullBoth(0);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [queryClient]);

  const visible = pull > 0 || refreshing;

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        aria-hidden
        sx={{
          position: 'fixed', top: 64, left: 0, right: 0, display: 'flex', justifyContent: 'center',
          pointerEvents: 'none', zIndex: (t) => t.zIndex.appBar - 1,
          transform: `translateY(${pull - 48}px)`,
          opacity: visible ? 1 : 0,
          transition: active.current ? 'none' : 'transform .2s, opacity .2s',
        }}
      >
        <Box sx={{ bgcolor: 'background.paper', borderRadius: '50%', p: 1, boxShadow: 3, display: 'grid', placeItems: 'center' }}>
          <CircularProgress
            size={24}
            variant={refreshing ? 'indeterminate' : 'determinate'}
            value={Math.min(100, (pull / THRESHOLD) * 100)}
          />
        </Box>
      </Box>
      {children}
    </Box>
  );
}
