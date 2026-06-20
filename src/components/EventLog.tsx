import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import dayjs from 'dayjs';
import { eventApi } from '../api/eventApi';
import type { EventSeverity, EventType } from '../api/types';
import { StatusLamp, type LampTone } from './StatusLamp';
import { ErrorState } from './ErrorState';
import { MONO_FONT } from '../theme';

const PAGE_SIZE = 12;

const SEV_TONE: Record<EventSeverity, LampTone> = {
  CRITICAL: 'error', WARNING: 'warning', SUCCESS: 'success', INFO: 'info',
};

/** Maps the backend's semantic event type to the instrument tag + Spanish label shown to operators. */
export const EVENT_LABEL: Record<EventType, { tag: string; message: string }> = {
  TEMP_OUT_OF_RANGE: { tag: 'TT-01', message: 'Temperatura fuera de rango' },
  HUMIDITY_OUT_OF_RANGE: { tag: 'RH-01', message: 'Humedad fuera de rango' },
  CRITICAL: { tag: 'SYS', message: 'Estado crítico' },
  RETURN_TO_NORMAL: { tag: 'SYS', message: 'Retorno a rango normal' },
  COOLER_ON: { tag: 'FAN-01', message: 'Cooler encendido' },
  COOLER_OFF: { tag: 'FAN-01', message: 'Cooler apagado' },
};

const ACK_KEY = 'plc.ackedEvents';
const loadAcked = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(ACK_KEY) ?? '[]') as string[]); } catch { return new Set(); }
};

/**
 * Annunciator-style event/alarm log backed by the server-paginated `/api/events` endpoint, so only
 * one page of rows is ever fetched and rendered (a long history never floods the client). Alarms
 * can be acknowledged; the acknowledged set persists in localStorage keyed by the stable event id,
 * so an operator's ACKs survive reloads. Acknowledgement is per page (the rest of the history isn't
 * loaded), which is enough since the newest, active alarms are on the first page.
 */
export function EventLog() {
  const [page, setPage] = useState(0);
  const [acked, setAcked] = useState<Set<string>>(loadAcked);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', page],
    queryFn: () => eventApi.getEvents({ page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });

  const persist = (next: Set<string>) => {
    setAcked(next);
    localStorage.setItem(ACK_KEY, JSON.stringify([...next]));
  };
  const ack = (id: string) => { const next = new Set(acked); next.add(id); persist(next); };

  const events = data?.content ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const total = data?.totalElements ?? 0;
  const safePage = Math.min(page, totalPages - 1);
  const ackVisible = () => {
    const next = new Set(acked);
    events.forEach((e) => { if (e.ackable) next.add(e.id); });
    persist(next);
  };
  const pageUnacked = events.filter((e) => e.ackable && !acked.has(e.id)).length;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle1">Eventos y alarmas</Typography>
            {pageUnacked > 0 && <Chip size="small" color="error" label={`${pageUnacked} sin reconocer`} sx={{ fontWeight: 600 }} />}
          </Stack>
          {pageUnacked > 0 && (
            <Button size="small" variant="outlined" onClick={ackVisible}>Reconocer visibles</Button>
          )}
        </Stack>

        {isLoading ? (
          <Stack spacing={1}>
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rounded" height={32} />)}
          </Stack>
        ) : isError ? (
          <ErrorState dense onRetry={() => refetch()} />
        ) : events.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            Sin eventos en el período.
          </Typography>
        ) : (
          <>
            <Box>
              {events.map((e) => {
                const { tag, message } = EVENT_LABEL[e.type];
                const isUnacked = e.ackable && !acked.has(e.id);
                return (
                  <Stack key={e.id} direction="row" spacing={1.25}
                    sx={{ alignItems: 'center', py: 0.85, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <StatusLamp tone={SEV_TONE[e.severity]} size={9} pulse={isUnacked} />
                    <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {dayjs(e.time).format('DD/MM HH:mm:ss')}
                    </Typography>
                    <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 11, color: 'text.disabled', width: 52, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                      {tag}
                    </Typography>
                    <Typography component="span" variant="body2" sx={{ flex: 1, minWidth: 0 }}>{message}</Typography>
                    {e.ackable && (isUnacked ? (
                      <Button size="small" onClick={() => ack(e.id)} sx={{ minWidth: 0, px: 1 }}>ACK</Button>
                    ) : (
                      <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 11, color: 'success.main', whiteSpace: 'nowrap' }}>ACK ✓</Typography>
                    ))}
                  </Stack>
                );
              })}
            </Box>

            {/* Server-side pagination: each page is a separate request, so the client never holds
                more than PAGE_SIZE rows. */}
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.25, flexWrap: 'wrap', gap: 1 }}>
              <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 11, color: 'text.disabled' }}>
                {total} eventos
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <IconButton size="small" aria-label="Página anterior" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                  <ChevronLeftRoundedIcon fontSize="small" />
                </IconButton>
                <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 12, color: 'text.secondary', minWidth: 76, textAlign: 'center' }}>
                  {safePage + 1} / {totalPages}
                </Typography>
                <IconButton size="small" aria-label="Página siguiente" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
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
