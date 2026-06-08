import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { measurementApi } from './api/measurementApi';
import { configApi } from './api/configApi';
import { useToast } from './components/toast';
import { formatPct, formatTemp } from './lib/format';

export type AlertSeverity = 'error' | 'warning' | 'info';

export interface AlertEvent {
  id: string;
  time: number;
  severity: AlertSeverity;
  message: string;
}

interface AlertsApi {
  events: AlertEvent[];
  unread: number;
  markRead: () => void;
  clear: () => void;
}

const AlertsContext = createContext<AlertsApi>({ events: [], unread: 0, markRead: () => undefined, clear: () => undefined });

export const useAlerts = (): AlertsApi => useContext(AlertsContext);

const DEFAULT_INTERVAL = 30;
const MAX_EVENTS = 50;

function notify(ev: AlertEvent) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try { new Notification('Sistema de Control PLC', { body: ev.message }); } catch { /* ignore */ }
  }
}

/**
 * Derives operational alerts from the latest reading, the active config and the data age:
 * sensor offline, readings out of band, and critical status. Each rising edge (a condition
 * becoming true) is logged once; error-level alerts also fire a toast and an OS notification
 * (when granted). Lives near the app root so the AppBar bell and the logic share state.
 */
export function AlertsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { data: latest } = useQuery({
    queryKey: ['measurement-latest'], queryFn: measurementApi.getLatest, retry: false, refetchInterval: 15000,
  });
  const { data: config } = useQuery({ queryKey: ['config-latest'], queryFn: configApi.getLatest, retry: false });

  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [unread, setUnread] = useState(0);
  const activeRef = useRef<Set<string>>(new Set());
  const latestRef = useRef(latest); latestRef.current = latest;
  const configRef = useRef(config); configRef.current = config;

  const pushEvent = useCallback((ev: AlertEvent) => {
    setEvents((prev) => [ev, ...prev].slice(0, MAX_EVENTS));
    setUnread((u) => u + 1);
    if (ev.severity === 'error') { notify(ev); toast(ev.message, 'error'); }
  }, [toast]);

  const evaluate = useCallback(() => {
    const m = latestRef.current;
    const c = configRef.current;
    const conditions: { key: string; severity: AlertSeverity; message: string }[] = [];
    const interval = c?.measurementIntervalSeconds ?? DEFAULT_INTERVAL;

    if (m) {
      const age = (Date.now() - new Date(m.createdAt).getTime()) / 1000;
      if (age > interval * 6) conditions.push({ key: 'offline', severity: 'error', message: 'Sensor sin conexión: no llegan mediciones' });
      if (c) {
        if (m.temperature < c.temperatureMin || m.temperature > c.temperatureMax) {
          conditions.push({ key: 'temp', severity: 'warning', message: `Temperatura fuera de rango: ${formatTemp(m.temperature)}` });
        }
        if (m.humidity < c.humidityMin || m.humidity > c.humidityMax) {
          conditions.push({ key: 'hum', severity: 'warning', message: `Humedad fuera de rango: ${formatPct(m.humidity)}` });
        }
      }
      if (m.status === 'CRITICAL') conditions.push({ key: 'critical', severity: 'error', message: 'Estado crítico del sistema' });
    }

    conditions.forEach((cond) => {
      if (!activeRef.current.has(cond.key)) {
        pushEvent({ id: `${cond.key}-${Date.now()}`, time: Date.now(), severity: cond.severity, message: cond.message });
      }
    });
    activeRef.current = new Set(conditions.map((cond) => cond.key));
  }, [pushEvent]);

  useEffect(() => { evaluate(); }, [latest, config, evaluate]);
  useEffect(() => {
    const id = setInterval(evaluate, 15000);
    return () => clearInterval(id);
  }, [evaluate]);

  const markRead = useCallback(() => setUnread(0), []);
  const clear = useCallback(() => { setEvents([]); setUnread(0); }, []);

  const value = useMemo(() => ({ events, unread, markRead, clear }), [events, unread, markRead, clear]);
  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}
