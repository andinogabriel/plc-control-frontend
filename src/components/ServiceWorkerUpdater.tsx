import { useEffect, useState } from 'react';
import { Button, Snackbar } from '@mui/material';

/**
 * Registers the service worker (production only) and, when a new version finishes installing
 * while the app is already controlled, shows a persistent "update available" snackbar. Tapping
 * "Actualizar" activates the waiting worker and reloads once it takes control.
 */
export function ServiceWorkerUpdater() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) setWaiting(sw);
        });
      });
    }).catch(() => undefined);
  }, []);

  const applyUpdate = () => {
    waiting?.postMessage({ type: 'SKIP_WAITING' });
    setWaiting(null);
  };

  return (
    <Snackbar
      open={waiting !== null}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message="Hay una nueva versión disponible"
      action={<Button color="primary" size="small" onClick={applyUpdate}>Actualizar</Button>}
    />
  );
}
