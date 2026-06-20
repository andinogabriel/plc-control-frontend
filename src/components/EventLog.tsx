import { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import dayjs from 'dayjs';
import type { MeasurementResponse } from '../api/types';
import { StatusLamp, type LampTone } from './StatusLamp';
import { MONO_FONT } from '../theme';

type EventSeverity = 'error' | 'warning' | 'success' | 'info';

interface LogEvent {
  id: string;
  time: string;
  severity: EventSeverity;
  tag: string;
  message: string;
  /** Only alarm events (out-of-range / critical) require an operator acknowledgement. */
  ackable: boolean;
}

const STATUS_TAG: Record<string, string> = {
  WARNING_TEMP: 'TT-01', WARNING_HUMIDITY: 'RH-01', WARNING: 'SYS', CRITICAL: 'SYS',
};
const STATUS_MSG: Record<string, string> = {
  WARNING_TEMP: 'Temperatura fuera de rango',
  WARNING_HUMIDITY: 'Humedad fuera de rango',
  WARNING: 'Alerta del sistema',
  CRITICAL: 'Estado crítico',
};

const SEV_TONE: Record<EventSeverity, LampTone> = {
  error: 'error', warning: 'warning', success: 'success', info: 'info',
};

/**
 * Derives a chronological event log from a measurement series: status transitions (entering an
 * alarm state, returning to normal) and cooler ON/OFF actions. Newest first. Pure, so it can be
 * unit-tested independently of the panel.
 */
export function deriveEvents(points: MeasurementResponse[]): LogEvent[] {
  const sorted = [...points].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const events: LogEvent[] = [];
  let prevStatus: string | undefined;
  let prevCooler: boolean | undefined;
  for (const p of sorted) {
    if (prevStatus !== undefined && p.status !== prevStatus) {
      if (p.status === 'NORMAL') {
        events.push({ id: `${p.createdAt}-s`, time: p.createdAt, severity: 'success', tag: 'SYS', message: 'Retorno a rango normal', ackable: false });
      } else {
        events.push({
          id: `${p.createdAt}-s`, time: p.createdAt,
          severity: p.status === 'CRITICAL' ? 'error' : 'warning',
          tag: STATUS_TAG[p.status] ?? 'SYS',
          message: STATUS_MSG[p.status] ?? p.status,
          ackable: true,
        });
      }
    }
    if (prevCooler !== undefined && p.coolerOn !== prevCooler) {
      events.push({
        id: `${p.createdAt}-c`, time: p.createdAt, severity: 'info', tag: 'FAN-01',
        message: p.coolerOn ? 'Cooler encendido' : 'Cooler apagado', ackable: false,
      });
    }
    prevStatus = p.status;
    prevCooler = p.coolerOn;
  }
  return events.reverse();
}

const PAGE_SIZE = 12;

const ACK_KEY = 'plc.ackedEvents';
const loadAcked = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(ACK_KEY) ?? '[]') as string[]); } catch { return new Set(); }
};

/**
 * Annunciator-style event/alarm log. Lists derived events newest-first with a severity lamp;
 * alarm rows can be acknowledged individually or all at once, and the acknowledged set persists
 * in localStorage so an operator's ACKs survive a reload.
 */
export function EventLog({ points }: { points: MeasurementResponse[] }) {
  const events = useMemo(() => deriveEvents(points), [points]);
  const [acked, setAcked] = useState<Set<string>>(loadAcked);
  const [page, setPage] = useState(0);

  const persist = (next: Set<string>) => {
    setAcked(next);
    localStorage.setItem(ACK_KEY, JSON.stringify([...next]));
  };
  const ack = (id: string) => { const next = new Set(acked); next.add(id); persist(next); };
  const ackAll = () => {
    const next = new Set(acked);
    events.forEach((e) => { if (e.ackable) next.add(e.id); });
    persist(next);
  };
  const unacked = events.filter((e) => e.ackable && !acked.has(e.id)).length;

  // Render only the current page so a long history (potentially thousands of rows) never floods
  // the DOM. `safePage` clamps when the event count shrinks under the current page on a refetch.
  const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageEvents = events.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle1">Eventos y alarmas</Typography>
            {unacked > 0 && <Chip size="small" color="error" label={`${unacked} sin reconocer`} sx={{ fontWeight: 600 }} />}
          </Stack>
          {unacked > 0 && (
            <Button size="small" variant="outlined" onClick={ackAll}>Reconocer todo</Button>
          )}
        </Stack>

        {events.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            Sin eventos en el período.
          </Typography>
        ) : (
          <>
            <Box>
              {pageEvents.map((e) => {
                const isUnacked = e.ackable && !acked.has(e.id);
                return (
                  <Stack key={e.id} direction="row" spacing={1.25}
                    sx={{ alignItems: 'center', py: 0.85, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <StatusLamp tone={SEV_TONE[e.severity]} size={9} pulse={isUnacked} />
                    <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {dayjs(e.time).format('DD/MM HH:mm:ss')}
                    </Typography>
                    <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 11, color: 'text.disabled', width: 52, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                      {e.tag}
                    </Typography>
                    <Typography component="span" variant="body2" sx={{ flex: 1, minWidth: 0 }}>{e.message}</Typography>
                    {e.ackable && (isUnacked ? (
                      <Button size="small" onClick={() => ack(e.id)} sx={{ minWidth: 0, px: 1 }}>ACK</Button>
                    ) : (
                      <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 11, color: 'success.main', whiteSpace: 'nowrap' }}>ACK ✓</Typography>
                    ))}
                  </Stack>
                );
              })}
            </Box>

            {/* Client-side pagination: only PAGE_SIZE rows are mounted at a time. */}
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.25, flexWrap: 'wrap', gap: 1 }}>
              <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 11, color: 'text.disabled' }}>
                {events.length} eventos
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <IconButton size="small" aria-label="Página anterior" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                  <ChevronLeftRoundedIcon fontSize="small" />
                </IconButton>
                <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 12, color: 'text.secondary', minWidth: 76, textAlign: 'center' }}>
                  {safePage + 1} / {pageCount}
                </Typography>
                <IconButton size="small" aria-label="Página siguiente" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                  <ChevronRightRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}
