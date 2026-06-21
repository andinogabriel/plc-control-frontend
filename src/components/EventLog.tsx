import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import dayjs from 'dayjs';
import { eventApi } from '../api/eventApi';
import type { EventResponse, EventSeverity, EventType, PageResponse } from '../api/types';
import { StatusLamp, type LampTone } from './StatusLamp';
import { ErrorState } from './ErrorState';
import { PanelTitle } from './PanelTitle';
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

/**
 * Annunciator-style event/alarm log backed by the server-paginated `/api/events` endpoint, so only
 * one page of rows is ever fetched and rendered. Acknowledgement is persisted server-side: ACKs are
 * shared across clients and survive restarts, and the "sin reconocer" badge is the global count
 * across the whole window (not just the page). Mutations invalidate the list + count so the UI
 * reflects the new state immediately.
 */
export function EventLog() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', page],
    queryFn: () => eventApi.getEvents({ page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });

  const { data: unacked = 0 } = useQuery({
    queryKey: ['events-unacked'],
    queryFn: () => eventApi.getUnacknowledgedCount(),
    refetchInterval: 30000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['events-unacked'] });
  };

  // Optimistic ACK: flip the row(s) and the global count immediately, roll back on error, and
  // reconcile with the server on settle.
  const snapshot = async () => {
    await queryClient.cancelQueries({ queryKey: ['events', page] });
    await queryClient.cancelQueries({ queryKey: ['events-unacked'] });
    return {
      prevPage: queryClient.getQueryData<PageResponse<EventResponse>>(['events', page]),
      prevCount: queryClient.getQueryData<number>(['events-unacked']),
    };
  };
  const rollback = (ctx?: { prevPage?: PageResponse<EventResponse>; prevCount?: number }) => {
    if (ctx?.prevPage) queryClient.setQueryData(['events', page], ctx.prevPage);
    if (typeof ctx?.prevCount === 'number') queryClient.setQueryData(['events-unacked'], ctx.prevCount);
  };
  const patchPage = (matches: (e: EventResponse) => boolean) => {
    const prev = queryClient.getQueryData<PageResponse<EventResponse>>(['events', page]);
    if (prev) {
      queryClient.setQueryData<PageResponse<EventResponse>>(['events', page], {
        ...prev,
        content: prev.content.map((e) => (matches(e) ? { ...e, acknowledged: true } : e)),
      });
    }
  };

  const ackOne = useMutation({
    mutationFn: eventApi.ackEvent,
    onMutate: async (id: string) => {
      const ctx = await snapshot();
      patchPage((e) => e.id === id);
      if (typeof ctx.prevCount === 'number') queryClient.setQueryData(['events-unacked'], Math.max(0, ctx.prevCount - 1));
      return ctx;
    },
    onError: (_err, _id, ctx) => rollback(ctx),
    onSettled: invalidate,
  });
  const ackAll = useMutation({
    mutationFn: () => eventApi.ackAll(),
    onMutate: async () => {
      const ctx = await snapshot();
      patchPage((e) => e.ackable);
      queryClient.setQueryData(['events-unacked'], 0);
      return ctx;
    },
    onError: (_err, _vars, ctx) => rollback(ctx),
    onSettled: invalidate,
  });

  const events = data?.content ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const total = data?.totalElements ?? 0;
  const safePage = Math.min(page, totalPages - 1);

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PanelTitle accent="warning">Eventos y alarmas</PanelTitle>
            {unacked > 0 && <Chip size="small" color="error" label={`${unacked} sin reconocer`} sx={{ fontWeight: 600 }} />}
          </Stack>
          {unacked > 0 && (
            <Button size="small" variant="outlined" onClick={() => ackAll.mutate()} disabled={ackAll.isPending}>
              Reconocer todo
            </Button>
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
                const isUnacked = e.ackable && !e.acknowledged;
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
                      <Button size="small" onClick={() => ackOne.mutate(e.id)} disabled={ackOne.isPending} sx={{ minWidth: 0, px: 1 }}>ACK</Button>
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
