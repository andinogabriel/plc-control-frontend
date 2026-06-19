import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, Stack, Button, Alert, Chip, IconButton, MenuItem, Skeleton,
  TextField, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { type GridColDef } from '@mui/x-data-grid';
import dayjs, { type Dayjs } from 'dayjs';
import { measurementApi, type MeasurementQuery } from '../api/measurementApi';
import { configApi } from '../api/configApi';
import type { MeasurementResponse, SystemStatus } from '../api/types';
import { AppDataGrid } from '../components/AppDataGrid';
import { dataGridHeight } from '../components/dataGridLayout';
import { StatusChip } from '../components/StatusChip';
import { AreaLineChart } from '../components/AreaLineChart';
import { FadeIn } from '../components/FadeIn';
import { DetailDialog } from '../components/DetailDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { RelativeTime } from '../components/RelativeTime';
import { TableEmptyOverlay } from '../components/TableEmptyOverlay';
import { TableToolbar } from '../components/TableToolbar';
import { MobileCardList } from '../components/MobileCardList';
import { MobileFilterSheet } from '../components/MobileFilterSheet';
import { useDensity } from '../hooks/useDensity';
import { useViewMode } from '../hooks/useViewMode';
import { exportChartPng, exportCsv } from '../lib/exporters';
import { formatPct, formatTemp } from '../lib/format';
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

  const { data: chartData, isLoading: chartLoading, isError: chartError, refetch: refetchChart } = useQuery({
    queryKey: ['measurement-chart', gFromParam, gToParam, gStatusParam],
    queryFn: () => measurementApi.getMeasurements({
      page: 0, size: CHART_PAGE_SIZE, maxPoints: CHART_PAGE_SIZE,
      from: gFromParam || undefined, to: gToParam || undefined, status: gStatusParam || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const { data: latest } = useQuery({
    queryKey: ['measurement-latest'],
    queryFn: measurementApi.getLatest,
    retry: false,
  });

  const { data: config } = useQuery({ queryKey: ['config-latest'], queryFn: configApi.getLatest, retry: false });
  const { data: configChanges } = useQuery({
    queryKey: ['config-changes', gFromParam, gToParam],
    queryFn: () => configApi.getHistory({ page: 0, size: 200, from: gFromParam || undefined, to: gToParam || undefined }),
    placeholderData: keepPreviousData,
  });
  const [dense, toggleDense] = useDensity();
  const [viewMode, setViewMode] = useViewMode();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const showCards = compact || viewMode === 'cards';
  const [mobileFilters, setMobileFilters] = useState(false);
  const tempChartRef = useRef<HTMLDivElement>(null);
  const humChartRef = useRef<HTMLDivElement>(null);

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

  const { data: tableData, isError: tableError, refetch: refetchTable } = useQuery({
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

  const sortDirFor = useCallback(
    (field: string): SortDirection => (sortField === field ? (sortDir as 'asc' | 'desc') : false),
    [sortField, sortDir],
  );
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
      renderCell: (params) => <RelativeTime value={params.value as string} />,
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
  ], [searchParams, updateParams, disabledHeaders, sortDirFor, toggleSort]);

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
  // Reserve the full rendered chart height (chart + legend + zoom brush) so the card keeps the
  // same size whether or not there are readings.
  const chartBlock = chartHeight + 78;

  // Vertical markers where the configuration changed, within the chart's time span.
  const spanStart = labels[0]?.getTime();
  const spanEnd = labels[labels.length - 1]?.getTime();
  const configMarkers = (configChanges?.content ?? [])
    .map((c) => new Date(c.createdAt))
    .filter((d) => spanStart != null && spanEnd != null && d.getTime() >= spanStart && d.getTime() <= spanEnd)
    .map((date) => ({ date }));
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

  const tempRefs = config ? [
    { value: config.temperatureMin, label: 'mín', color: theme.palette.warning.main },
    { value: config.temperatureMax, label: 'máx', color: theme.palette.error.main },
  ] : undefined;
  const humRefs = config ? [
    { value: config.humidityMin, label: 'mín', color: theme.palette.warning.main },
    { value: config.humidityMax, label: 'máx', color: theme.palette.error.main },
  ] : undefined;

  const handleExportCsv = () => exportCsv('mediciones.csv', tableData?.content ?? [], [
    { header: 'Fecha', value: (r: MeasurementResponse) => new Date(r.createdAt).toLocaleString() },
    { header: 'Temperatura (C)', value: (r: MeasurementResponse) => r.temperature },
    { header: 'Humedad (%)', value: (r: MeasurementResponse) => r.humidity },
    { header: 'Cooler', value: (r: MeasurementResponse) => (r.coolerOn ? 'ON' : 'OFF') },
    { header: 'Estado', value: (r: MeasurementResponse) => r.status },
  ]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Mediciones</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Histórico de lecturas de la Raspberry. El rango de arriba ajusta los gráficos; la tabla se
        filtra por columna.
      </Typography>

      {latest && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Última medición: {formatTemp(latest.temperature)} / {formatPct(latest.humidity)} ·{' '}
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
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
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
          <Card><CardContent ref={tempChartRef}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ width: 6, height: 22, borderRadius: 1, bgcolor: 'primary.main' }} />
                <Typography variant="subtitle1">Temperatura vs tiempo</Typography>
              </Stack>
              <Tooltip title="Descargar PNG">
                <span><IconButton size="small" disabled={points.length === 0}
                  onClick={() => exportChartPng(tempChartRef.current, 'temperatura.png', { title: 'Temperatura vs tiempo', source: 'Mediciones' })}
                  aria-label="Descargar gráfico">
                  <ImageRoundedIcon fontSize="small" /></IconButton></span>
              </Tooltip>
            </Stack>
            {chartLoading ? (
              <Skeleton variant="rounded" height={chartBlock} />
            ) : chartError ? (
              <ErrorState dense height={chartBlock} onRetry={() => refetchChart()} />
            ) : points.length > 0 ? (
              <FadeIn>
                <AreaLineChart height={chartHeight} zoomable mode="date" labels={labels} referenceLines={tempRefs} verticalMarkers={configMarkers}
                  onPointClick={(i) => setSelected(points[i] ?? null)}
                  series={[{ id: 'temp', label: 'Temperatura (°C)', data: points.map((m) => m.temperature), color: theme.palette.primary.main }]} />
              </FadeIn>
            ) : (
              <EmptyState dense height={chartBlock} icon={<ShowChartRoundedIcon sx={{ fontSize: 30 }} />}
                title="Sin mediciones en este rango" description="Ajustá el rango o los filtros de los gráficos." />
            )}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent ref={humChartRef}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ width: 6, height: 22, borderRadius: 1, bgcolor: 'secondary.main' }} />
                <Typography variant="subtitle1">Humedad vs tiempo</Typography>
              </Stack>
              <Tooltip title="Descargar PNG">
                <span><IconButton size="small" disabled={points.length === 0}
                  onClick={() => exportChartPng(humChartRef.current, 'humedad.png', { title: 'Humedad vs tiempo', source: 'Mediciones' })}
                  aria-label="Descargar gráfico">
                  <ImageRoundedIcon fontSize="small" /></IconButton></span>
              </Tooltip>
            </Stack>
            {chartLoading ? (
              <Skeleton variant="rounded" height={chartBlock} />
            ) : chartError ? (
              <ErrorState dense height={chartBlock} onRetry={() => refetchChart()} />
            ) : points.length > 0 ? (
              <FadeIn>
                <AreaLineChart height={chartHeight} zoomable mode="date" labels={labels} referenceLines={humRefs} verticalMarkers={configMarkers}
                  onPointClick={(i) => setSelected(points[i] ?? null)}
                  series={[{ id: 'hum', label: 'Humedad (%)', data: points.map((m) => m.humidity), color: theme.palette.secondary.main }]} />
              </FadeIn>
            ) : (
              <EmptyState dense height={chartBlock} icon={<ShowChartRoundedIcon sx={{ fontSize: 30 }} />}
                title="Sin mediciones en este rango" description="Ajustá el rango o los filtros de los gráficos." />
            )}
          </CardContent></Card>
        </Grid>
      </Grid>

      {configMarkers.length > 0 && (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 3, color: 'text.secondary' }}>
          <Box sx={{ width: 18, borderTop: '2px dashed', borderColor: 'info.main' }} />
          <Typography variant="caption">Líneas verticales: cambios de configuración ({configMarkers.length})</Typography>
        </Stack>
      )}

      <Card>
        <CardContent>
          <TableToolbar dense={dense} onToggleDense={toggleDense}
            viewMode={viewMode} onSetViewMode={setViewMode}
            onExportCsv={handleExportCsv} exportDisabled={(tableData?.content ?? []).length === 0}
            onOpenFilters={showCards ? () => setMobileFilters(true) : undefined} />
          <MobileFilterSheet open={mobileFilters} onClose={() => setMobileFilters(false)} columns={columns} />
          {tableError ? (
            <ErrorState height={dataGridHeight(dense)} onRetry={() => refetchTable()} />
          ) : showCards ? (
            <MobileCardList
              rows={tableData?.content ?? []}
              loading={!tableData}
              page={page}
              pageCount={Math.max(1, Math.ceil(rowCount / size))}
              onPageChange={(p) => updateParams({ page: String(p) })}
              onRowClick={(m) => setSelected(m)}
              empty={<TableEmptyOverlay hasFilters={hasTableFilters} onClear={clearTableFilters} />}
              getCard={(m) => ({
                title: <RelativeTime value={m.createdAt} />,
                fields: [
                  { label: 'Temperatura', value: formatTemp(m.temperature) },
                  { label: 'Humedad', value: formatPct(m.humidity) },
                  { label: 'Cooler', value: m.coolerOn ? 'ON' : 'OFF' },
                  { label: 'Estado', value: <StatusChip status={m.status} /> },
                ],
              })}
            />
          ) : (
            <AppDataGrid
              dense={dense}
              rows={tableData?.content ?? []}
              columns={columns}
              rowCount={rowCount}
              loading={!tableData}
              onRowClick={(p) => setSelected(p.row as MeasurementResponse)}
              slots={{ noRowsOverlay: () => <TableEmptyOverlay hasFilters={hasTableFilters} onClear={clearTableFilters} /> }}
              paginationModel={{ page, pageSize: size }}
              onPaginationModelChange={(model) =>
                updateParams({ page: String(model.page), size: String(model.pageSize) })}
            />
          )}
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
