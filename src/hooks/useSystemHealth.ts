import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { measurementApi } from '../api/measurementApi';
import { configApi } from '../api/configApi';

export type HealthStatus = 'online' | 'delayed' | 'offline' | 'unknown';

export interface SystemHealth {
  status: HealthStatus;
  ageSeconds: number | null;
  lastAt: string | null;
  interval: number;
}

const DEFAULT_INTERVAL = 30;

/**
 * Derives whether the Raspberry is still reporting, by comparing the age of the latest
 * measurement against the configured interval:
 *   age <= 2x interval  -> online
 *   age <= 6x interval  -> delayed
 *   otherwise           -> offline
 * Re-evaluates every second so the badge ages in real time. Reuses the shared query keys so
 * it does not add network traffic.
 */
export function useSystemHealth(): SystemHealth {
  const { data: latest } = useQuery({
    queryKey: ['measurement-latest'], queryFn: measurementApi.getLatest, retry: false, refetchInterval: 15000,
  });
  const { data: config } = useQuery({
    queryKey: ['config-latest'], queryFn: configApi.getLatest, retry: false,
  });

  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const interval = config?.measurementIntervalSeconds ?? DEFAULT_INTERVAL;

  if (!latest) {
    return { status: 'unknown', ageSeconds: null, lastAt: null, interval };
  }

  const ageSeconds = Math.max(0, Math.round((Date.now() - new Date(latest.createdAt).getTime()) / 1000));
  const status: HealthStatus = ageSeconds <= interval * 2 ? 'online'
    : ageSeconds <= interval * 6 ? 'delayed' : 'offline';

  return { status, ageSeconds, lastAt: latest.createdAt, interval };
}
