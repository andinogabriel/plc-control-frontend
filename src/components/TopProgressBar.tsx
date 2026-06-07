import { LinearProgress, Fade } from '@mui/material';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/**
 * Thin global activity bar pinned under the AppBar. Visible while any query is fetching or any
 * mutation is in flight, so the user always knows the app is talking to the backend.
 */
export function TopProgressBar() {
  const busy = useIsFetching() + useIsMutating() > 0;
  return (
    <Fade in={busy} unmountOnExit>
      <LinearProgress
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 3,
          zIndex: (t) => t.zIndex.drawer + 2,
        }}
      />
    </Fade>
  );
}
