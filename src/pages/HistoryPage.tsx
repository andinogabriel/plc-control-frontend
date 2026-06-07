import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, Stack, Button, Alert, Chip, MenuItem, Skeleton, TextField,
  useMediaQuery, useTheme,
} from '@mui/material';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { type GridColDef } from '@mui/x-data-grid';
import dayjs, { type Dayjs } from 'dayjs';
import { measurementApi, type MeasurementQuery } from '../api/measurementApi';
import type { MeasurementResponse, SystemStatus } from '../api/types';
import { AppDataGrid } from '../components/AppDataGrid';
import { StatusChip } from '../components/StatusChip';
import { AreaLineChart } from '../components/AreaLineChart';
import { DetailDialog } from '../components/DetailDialog';
import { EmptyState } from '../components/EmptyState';
import { TableEmptyOverlay } from '../components/TableEmptyOverlay';
import {
  DateRangeFilterHeader, NumberRangeFilterHeader, SelectFilterHeader, type SortDirection,
} from '../components/columnFilters';

const CHART_PAGE_SIZE = 1000;
const TABLE_FILTER_KEYS = [
  'from', 'to', 'status', 'temperatureMin', 'temperatureMax', 'humidityMin', 'humidityMax', 'coolerOn',
];

const STATUS_OPTIONS: { value: SystemStatus; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'WARNING_TEMP', label: 'Alerta temperatura' },
  { value: 'WARNING_HUMIDITY', label: 'Alerta humedad' },
  { value: 'CRITICAL', label: 'Crítico' },
];

export function HistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Top bar (charts only): gfrom / gto / gstatus ---
  const gFromParam = searchParams.get('gfrom') ?? '';
  const gToParam = searchParams.get('gto') ?? '';
  const gStatusParam = (searchParams.get('gstatus') ?? '') as SystemStatus | '';
  const [gFrom, setGFrom] = useState<Dayjs | null>(gFromParam ? dayjs(gFromParam) : null);
  const [gTo, setGTo] = useState<Dayjs | null>(gToParam ? dayjs(gToParam) : null);
  const [gStatus, setGStatus] = useState<SystemStatus | ''>(gStatusParam);

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['measurement-chart', gFromParam, gToParam, gStatusParam],
    queryFn: () => measurementApi.getMeasurements({
      page: 0, size: CHART_PAGE_SIZE,
      from: gFromParam || undefined, to: gToParam || undefined, status: gStatusParam || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const { data: latest } = useQuery({
    queryKey: ['measurement-latest'],
    queryFn: measurementApi.getLatest,
    retry: false,
  });

  // --- Table (own per-column filters), backed by URL params ---
  const page = Number(searchParams.get('page') ?? '0');
  const size = Number(searchParams.get('size') ?? '10');
  const num = (key: string) => {
    const v = searchParams.get(key);
    return v == null || v === '' ? undefined : Number(v);
  };
  const coolerParam = searchParams.get('coolerOn');
  const sortParam = searchParams.get('sort') ?? '';
  const [sortField, sortDir] = sortParam ? sortParam.split(',') : ['', ''];
  const tableQuery: MeasurementQuery = {
    page, size,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    status: (searchParams.get('status') as SystemStatus) || undefined,
    temperatureMin: num('temperatureMin'),
    temperatureMax: num('temperatureMax'),
    humidityMin: num('humidityMin'),
    humidityMax: num('humidityMax'),
    coolerOn: coolerParam == null ? undefined : coolerParam === 'true',
    sort: sortParam || undefined,
  };
  const tableKey = JSON.stringify(tableQuery);

  const { data: tableData } = useQuery({
    queryKey: ['measurement-table', tableKey],
    queryFn: () => measurementApi.getMeasurements(tableQuery),
    placeholderData: keepPreviousData,
  });

  const [rowCount, setRowCount] = useState(0);
  useEffect(() => {
    if (tableData?.totalElements != null) setRowCount(tableData.totalElements);
  }, [tableData?.totalElements]);

  const hasTableFilters = TABLE_FILTER_KEYS.some((k) => searchParams.get(k));
  const disabledHeaders = rowCount === 0 && hasTableFilters;

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === '') next.delete(k);
        else next.set(k, v);
      });
      return next;
    });
  }, [setSearchParams]);

  const sortDirFor = (field: string): SortDirection => (sortField === field ? (sortDir as 'asc' | 'desc') : false);
  const toggleSort = useCallback((field: string) => {
    const current = searchParams.get('sort');
    const [f, d] = current ? current.split(',') : ['', ''];
    const next = f !== field ? 'asc' : d === 'asc' ? 'desc' : d === 'desc' ? '' : 'asc';
    updateParams({ sort: next ? `${field},${next}` : undefined, page: '0' });
  }, [searchParams, updateParams]);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'createdAt', headerName: 'Fecha', flex: 1.4, minWidth: 180, sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <DateRangeFilterHeader label="Fecha" disabled={disabledHeaders}
          sortDirection={sortDirFor('createdAt')} onToggleSort={() => toggleSort('createdAt')}
          from={searchParams.get('from') ?? ''} to={searchParams.get('to') ?? ''}
          onApply={(f, t) => updateParams({ from: f, to: t, page: '0' })} />
      ),
      valueFormatter: (value) => new Date(value as string).toLocaleString(),
    },
    {
      field: 'temperature', headerName: 'Temp (°C)', flex: 1, minWidth: 130, type: 'number', sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <NumberRangeFilterHeader label="Temp (°C)" lo={-10} hi={100} disabled={disabledHeaders}
          sortDirection={sortDirFor('temperature')} onToggleSort={() => toggleSort('temperature')}
          min={searchParams.get('temperatureMin') ?? ''} max={searchParams.get('temperatureMax') ?? ''}
          onApply={(mn, mx) => updateParams({ temperatureMin: mn, temperatureMax: mx, page: '0' })} />
      ),
    },
    {
      field: 'humidity', headerName: 'Humedad (%)', flex: 1, minWidth: 140, type: 'number', sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <NumberRangeFilterHeader label="Humedad (%)" lo={0} hi={100} disabled={disabledHeaders}
          sortDirection={sortDirFor('humidity')} onToggleSort={() => toggleSort('humidity')}
          min={searchParams.get('humidityMin') ?? ''} max={searchParams.get('humidityMax') ?? ''}
          onApply={(mn, mx) => updateParams({ humidityMin: mn, humidityMax: mx, page: '0' })} />
      ),
    },
    {
      field: 'coolerOn', headerName: 'Cooler', flex: 0.8, minWidth: 120, sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <SelectFilterHeader label="Cooler" disabled={disabledHeaders} value={searchParams.get('coolerOn') ?? ''}
          sortDirection={sortDirFor('coolerOn')} onToggleSort={() => toggleSort('coolerOn')}
          options={[{ value: 'true', label: 'ON' }, { value: 'false', label: 'OFF' }]}
          onApply={(v) => updateParams({ coolerOn: v, page: '0' })} />
      ),
      valueFormatter: (value) => (value ? 'ON' : 'OFF'),
    },
    {
      field: 'status', headerName: 'Estado', flex: 1.2, minWidth: 160, sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <SelectFilterHeader label="Estado" disabled={disabledHeaders} value={searchParams.get('status') ?? ''}
          sortDirection={sortDirFor('status')} onToggleSort={() => toggleSort('status')}
          options={STATUS_OPTIONS}
          onApply={(v) => updateParams({ status: v, page: '0' })} />
      ),
      renderCell: (params) => <StatusChip status={params.value as string} />,
    },
  ], [searchParams, updateParams, disabledHeaders, sortField, sortDir]);

  const clearTableFilters = useCallback(() => {
    const cleared: Record<string, undefined> = { page: undefined };
    TABLE_FILTER_KEYS.forEach((k) => { cleared[k] = undefined; });
    updateParams(cleared);
  }, [updateParams]);

  // --- Top bar handlers (charts) ---
  const datesValid = (!gFrom || gFrom.isValid()) && (!gTo || gTo.isValid());
  const rangeValid = !(gFrom && gTo) || !gFrom.isAfter(gTo);
  const canApplyCharts = (Boolean(gFrom) || Boolean(gTo) || Boolean(gStatus)) && datesValid && rangeValid;

  const applyChartFilters = () => updateParams({
    gfrom: gFrom ? gFrom.toISOString() : undefined,
    gto: gTo ? gTo.toISOString() : undefined,
    gstatus: gStatus || undefined,
  });
  const clearChartFilters = () => {
    setGFrom(null); setGTo(null); setGStatus('');
    updateParams({ gfrom: undefined, gto: undefined, gstatus: undefined });
  };

  const points = (chartData?.content ?? []).slice().reverse();
  const labels = points.map((m) => new Date(m.createdAt));
  const chartHeight = isMobile ? 220 : 260;
  const [selected, setSelected] = useState<MeasurementResponse | null>(null);

  // Active chart-range summary chips: make an applied range visible even when the data looks
  // the same (e.g. a "Desde" earlier than the first record returns the same rows).
  const fmtChip = (iso: string) => dayjs(iso).format('D MMM YYYY HH:mm');
  const statusChipLabel = STATUS_OPTIONS.find((o) => o.value === gStatusParam)?.label;
  const hasChartFilters = Boolean(gFromParam || gToParam || gStatusParam);
  const removeChartParam = (patch: Record<string, undefined>, reset: () => void) => {
    reset();
    updateParams(patch);
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Mediciones</Typography>

      {latest && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Última medición: {latest.temperature.toFixed(1)} °C / {latest.humidity.toFixed(1)} % ·{' '}
          {new Date(latest.createdAt).toLocaleString()}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'center' } }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>Rango de gráficos:</Typography>
            <DateTimePicker label="Desde" value={gFrom} onChange={setGFrom} maxDateTime={gTo ?? undefined} disableFuture
              slotProps={{ textField: { size: 'small', sx: { flex: 1, minWidth: 180 } } }} />
            <DateTimePicker label="Hasta" value={gTo} onChange={setGTo} minDateTime={gFrom ?? undefined} disableFuture
              slotProps={{ textField: { size: 'small', sx: { flex: 1, minWidth: 180 } } }} />
            <TextField select size="small" label="Estado" value={gStatus}
              onChange={(e) => setGStatus(e.target.value as SystemStatus | '')} sx={{ flex: 1, minWidth: 160 }}>
              <MenuItem value="">Todos</MenuItem>
              {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', lg: 'auto' } }}>
              <Button variant="contained" onClick={applyChartFilters} disabled={!canApplyCharts}>Aplicar</Button>
              <Button onClick={clearChartFilters}>Limpiar</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {hasChartFilters && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }} alignItems="center">
          <Typography variant="caption" color="text.secondary">Gráficos:</Typography>
          {gFromParam && (
            <Chip size="small" label={`Desde ${fmtChip(gFromParam)}`}
              onDelete={() => removeChartParam({ gfrom: undefined }, () => setGFrom(null))} />
          )}
          <Chip size="small" variant="outlined"
            label={gToParam ? `Hasta ${fmtChip(gToParam)}` : 'Hasta ahora'}
            onDelete={gToParam ? () => removeChartParam({ gto: undefined }, () => setGTo(null)) : undefined} />
          {statusChipLabel && (
            <Chip size="small" color="primary" variant="outlined" label={`Estado: ${statusChipLabel}`}
              onDelete={() => removeChartParam({ gstatus: undefined }, () => setGStatus(''))} />
          )}
        </Stack>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="subtitle1" gutterBottom>Temperatura vs tiempo</Typography>
            {chartLoading ? (
              <Skeleton variant="rounded" height={chartHeight} />
            ) : points.length > 0 ? (
              <AreaLineChart height={chartHeight} mode="date" labels={labels}
                onPointClick={(i) => setSelected(points[i] ?? null)}
                series={[{ id: 'temp', label: 'Temperatura (°C)', data: points.map((m) => m.temperature), color: theme.palette.primary.main }]} />
            ) : (
              <EmptyState dense icon={<ShowChartRoundedIcon sx={{ fontSize: 30 }} />}
                title="Sin mediciones en este rango" description="Ajustá el rango o los filtros de los gráficos." />
            )}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="subtitle1" gutterBottom>Humedad vs tiempo</Typography>
            {chartLoading ? (
              <Skeleton variant="rounded" height={chartHeight} />
            ) : points.length > 0 ? (
              <AreaLineChart height={chartHeight} mode="date" labels={labels}
                onPointClick={(i) => setSelected(points[i] ?? null)}
                series={[{ id: 'hum', label: 'Humedad (%)', data: points.map((m) => m.humidity), color: theme.palette.secondary.main }]} />
            ) : (
              <EmptyState dense icon={<ShowChartRoundedIcon sx={{ fontSize: 30 }} />}
                title="Sin mediciones en este rango" description="Ajustá el rango o los filtros de los gráficos." />
            )}
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <AppDataGrid
            rows={tableData?.content ?? []}
            columns={columns}
            rowCount={rowCount}
            loading={!tableData}
            slots={{ noRowsOverlay: () => <TableEmptyOverlay hasFilters={hasTableFilters} onClear={clearTableFilters} /> }}
            paginationModel={{ page, pageSize: size }}
            onPaginationModelChange={(model) =>
              updateParams({ page: String(model.page), size: String(model.pageSize) })}
          />
        </CardContent>
      </Card>

      <DetailDialog
        open={selected !== null}
        title="Detalle de medición"
        onClose={() => setSelected(null)}
        rows={selected ? [
          { label: 'Fecha', value: new Date(selected.createdAt).toLocaleString() },
          { label: 'Temperatura', value: `${selected.temperature} °C` },
          { label: 'Humedad', value: `${selected.humidity} %` },
          { label: 'Cooler', value: selected.coolerOn ? 'ON' : 'OFF' },
          { label: 'Relay', value: selected.relayOn ? 'ON' : 'OFF' },
          { label: 'Estado', value: <StatusChip status={selected.status} /> },
        ] : []}
      />
    </Box>
  );
}
