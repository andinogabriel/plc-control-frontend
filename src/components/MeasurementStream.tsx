import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../api/client';
import type { MeasurementResponse } from '../api/types';

/**
 * Subscribes to the backend SSE stream and pushes each new measurement into the query cache, so
 * the dashboard, kiosk and charts update in real time (polling stays as a fallback). EventSource
 * reconnects on its own; we just (re)bind on mount. Renders nothing.
 */
export function MeasurementStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;
    const source = new EventSource(`${API_BASE_URL}/api/measurements/stream`);

    source.addEventListener('measurement', (event) => {
      try {
        const measurement = JSON.parse((event as MessageEvent).data) as MeasurementResponse;
        // Instant latest reading (also refreshes the health badge's "updated" timestamp)...
        queryClient.setQueryData(['measurement-latest'], measurement);
        // ...and let the range-based views pick up the new point.
        queryClient.invalidateQueries({ queryKey: ['measurements-recent'] });
        queryClient.invalidateQueries({ queryKey: ['measurement-chart'] });
        queryClient.invalidateQueries({ queryKey: ['measurement-table'] });
      } catch {
        /* ignore malformed events */
      }
    });

    return () => source.close();
  }, [queryClient]);

  return null;
}
