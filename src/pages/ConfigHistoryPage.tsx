import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Stack, Button, Chip, Grid, Skeleton, useTheme,
} from '@mui/material';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { type GridColDef } from '@mui/x-data-grid';
import dayjs, { type Dayjs } from 'dayjs';
import { configApi, type ConfigHistoryQuery } from '../api/configApi';
import type { ConfigResponse } from '../api/types';
import { AppDataGrid } from '../components/AppDataGrid';
import { AreaLineChart } from '../components/AreaLineChart';
import { DetailDialog } from '../components/DetailDialog';
import { EmptyState } from '../components/EmptyState';
import { TableEmptyOverlay } from '../components/TableEmptyOverlay';
import {
  DateRangeFilterHeader, NumberFilterHeader, SortableHeader, TextFilterHeader, type SortDirection,
} from '../components/columnFilters';

const CHART_PAGE_SIZE = 1000;
const TABLE_FILTER_KEYS = [
  'from', 'to', 'createdByName', 'createdByEmail',
  'temperatureMin', 'temperatureMax', 'humidityMin', 'humidityMax',
];

export function ConfigHistoryPage() {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Top bar (charts only): date range stored as gfrom/gto ---
  const gFromParam = searchParams.get('gfrom') ?? '';
  const gToParam = searchParams.get('gto') ?? '';
  const [gFrom, setGFrom] = useState<Dayjs | null>(gFromParam ? dayjs(gFromParam) : null);
  const [gTo, setGTo] = useState<Dayjs | null>(gToParam ? dayjs(gToParam) : null);

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['config-chart', gFromParam, gToParam],
    queryFn: () => configApi.getHistory({ page: 0, size: CHART_PAGE_SIZE, from: gFromParam || undefined, to: gToParam || undefined }),
    placeholderData: keepPreviousData,
  });

  // --- Table (own per-column filters), all backed by the URL query params ---
  const page = Number(searchParams.get('page') ?? '0');
  const size = Number(searchParams.get('size') ?? '10');
  const num = (key: string) => {
    const v = searchParams.get(key);
    return v == null || v === '' ? undefined : Number(v);
  };
  const sortParam = searchParams.get('sort') ?? '';
  const [sortField, sortDir] = sortParam ? sortParam.split(',') : ['', ''];

  const tableQuery: ConfigHistoryQuery = {
    page, size,
    createdByName: searchParams.get('createdByName') || undefined,
    createdByEmail: searchParams.get('createdByEmail') || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    temperatureMin: num('temperatureMin'),
    temperatureMax: num('temperatureMax'),
    humidityMin: num('humidityMin'),
    humidityMax: num('humidityMax'),
    sort: sortParam || undefined,
  };
  const tableKey = JSON.stringify(tableQuery);

  const { data: tableData } = useQuery({
    queryKey: ['config-table', tableKey],
    queryFn: () => configApi.getHistory(tableQuery),
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

  // Columns with per-column filter headers (recompute when the URL or empty-state changes).
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'createdAt', headerName: 'Fecha', flex: 1.8, minWidth: 180, sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <DateRangeFilterHeader label="Fecha" disabled={disabledHeaders}
          sortDirection={sortDirFor('createdAt')} onToggleSort={() => toggleSort('createdAt')}
          from={searchParams.get('from') ?? ''} to={searchParams.get('to') ?? ''}
          onApply={(f, t) => updateParams({ from: f, to: t, page: '0' })} />
      ),
      valueFormatter: (value) => new Date(value as string).toLocaleString(),
    },
    {
      field: 'createdByName', headerName: 'Nombre', flex: 1.5, minWidth: 150, sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <TextFilterHeader label="Nombre" disabled={disabledHeaders} value={searchParams.get('createdByName') ?? ''}
          sortDirection={sortDirFor('createdByName')} onToggleSort={() => toggleSort('createdByName')}
          onApply={(v) => updateParams({ createdByName: v, page: '0' })} />
      ),
    },
    {
      field: 'createdByEmail', headerName: 'Email', flex: 2.2, minWidth: 210, sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <TextFilterHeader label="Email" disabled={disabledHeaders} value={searchParams.get('createdByEmail') ?? ''}
          sortDirection={sortDirFor('createdByEmail')} onToggleSort={() => toggleSort('createdByEmail')}
          onApply={(v) => updateParams({ createdByEmail: v, page: '0' })} />
      ),
    },
    {
      field: 'temperatureMin', headerName: 'T. mín', flex: 0.65, minWidth: 104, type: 'number', sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <NumberFilterHeader label="T. mín" min={-10} max={60} disabled={disabledHeaders} value={searchParams.get('temperatureMin') ?? ''}
          sortDirection={sortDirFor('temperatureMin')} onToggleSort={() => toggleSort('temperatureMin')}
          onApply={(v) => updateParams({ temperatureMin: v, page: '0' })} />
      ),
    },
    {
      field: 'temperatureMax', headerName: 'T. máx', flex: 0.65, minWidth: 104, type: 'number', sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <NumberFilterHeader label="T. máx" min={-10} max={60} disabled={disabledHeaders} value={searchParams.get('temperatureMax') ?? ''}
          sortDirection={sortDirFor('temperatureMax')} onToggleSort={() => toggleSort('temperatureMax')}
          onApply={(v) => updateParams({ temperatureMax: v, page: '0' })} />
      ),
    },
    {
      field: 'humidityMin', headerName: 'H. mín', flex: 0.65, minWidth: 104, type: 'number', sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <NumberFilterHeader label="H. mín" min={0} max={100} disabled={disabledHeaders} value={searchParams.get('humidityMin') ?? ''}
          sortDirection={sortDirFor('humidityMin')} onToggleSort={() => toggleSort('humidityMin')}
          onApply={(v) => updateParams({ humidityMin: v, page: '0' })} />
      ),
    },
    {
      field: 'humidityMax', headerName: 'H. máx', flex: 0.65, minWidth: 104, type: 'number', sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => (
        <NumberFilterHeader label="H. máx" min={0} max={100} disabled={disabledHeaders} value={searchParams.get('humidityMax') ?? ''}
          sortDirection={sortDirFor('humidityMax')} onToggleSort={() => toggleSort('humidityMax')}
          onApply={(v) => updateParams({ humidityMax: v, page: '0' })} />
      ),
    },
    {
      field: 'hysteresisTemperature', headerName: 'Hist. T', flex: 0.55, minWidth: 96, type: 'number', sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => <SortableHeader label="Hist. T" sortDirection={sortDirFor('hysteresisTemperature')} onToggleSort={() => toggleSort('hysteresisTemperature')} />,
    },
    {
      field: 'hysteresisHumidity', headerName: 'Hist. H', flex: 0.55, minWidth: 96, type: 'number', sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => <SortableHeader label="Hist. H" sortDirection={sortDirFor('hysteresisHumidity')} onToggleSort={() => toggleSort('hysteresisHumidity')} />,
    },
    {
      field: 'measurementIntervalSeconds', headerName: 'Intervalo (s)', flex: 0.8, minWidth: 124, type: 'number', sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => <SortableHeader label="Intervalo (s)" sortDirection={sortDirFor('measurementIntervalSeconds')} onToggleSort={() => toggleSort('measurementIntervalSeconds')} />,
    },
    {
      field: 'active', headerName: 'Activa', flex: 0.55, minWidth: 96, sortable: false, align: 'center', headerAlign: 'center',
      renderHeader: () => <SortableHeader label="Activa" sortDirection={sortDirFor('active')} onToggleSort={() => toggleSort('active')} />,
      renderCell: (params) =>
        params.value
          ? <Chip label="Activa" color="success" size="small" />
          : <Chip label="—" size="small" variant="outlined" />,
    },
  ], [searchParams, updateParams, disabledHeaders, sortField, sortDir]);

  const clearTableFilters = useCallback(() => {
    const cleared: Record<string, undefined> = { page: undefined };
    TABLE_FILTER_KEYS.forEach((k) => { cleared[k] = undefined; });
    updateParams(cleared);
  }, [updateParams]);

  // --- Top bar handlers ---
  const datesValid = (!gFrom || gFrom.isValid()) && (!gTo || gTo.isValid());
  const rangeValid = !(gFrom && gTo) || !gFrom.isAfter(gTo);
  const canApplyCharts = (Boolean(gFrom) || Boolean(gTo)) && datesValid && rangeValid;

  const applyChartRange = () => updateParams({
    gfrom: gFrom ? gFrom.toISOString() : undefined,
    gto: gTo ? gTo.toISOString() : undefined,
  });
  const clearChartRange = () => { setGFrom(null); setGTo(null); updateParams({ gfrom: undefined, gto: undefined }); };

  const points = (chartData?.content ?? []).slice().reverse();
  const labels = points.map((c) => new Date(c.createdAt));
  const [selected, setSelected] = useState<ConfigResponse | null>(null);

  // Active chart-range summary chips (visible feedback that a range was applied).
  const fmtChip = (iso: string) => dayjs(iso).format('D MMM YYYY HH:mm');
  const hasChartFilters = Boolean(gFromParam || gToParam);

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Historial de configuraciones</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Auditoría de cada cambio de umbrales. El rango de fechas de arriba ajusta los gráficos;
        la tabla se filtra por columna.
      </Typography>

      <Card sx={{ my: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>Rango de gráficos:</Typography>
            <DateTimePicker label="Desde" value={gFrom} onChange={setGFrom} maxDateTime={gTo ?? undefined} disableFuture
              slotProps={{ textField: { size: 'small', sx: { flex: 1, minWidth: 200 } } }} />
            <DateTimePicker label="Hasta" value={gTo} onChange={setGTo} minDateTime={gFrom ?? undefined} disableFuture
              slotProps={{ textField: { size: 'small', sx: { flex: 1, minWidth: 200 } } }} />
            <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', md: 'auto' } }}>
              <Button variant="contained" onClick={applyChartRange} disabled={!canApplyCharts}>Aplicar</Button>
              <Button onClick={clearChartRange}>Limpiar</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {hasChartFilters && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }} alignItems="center">
          <Typography variant="caption" color="text.secondary">Gráficos:</Typography>
          {gFromParam && (
            <Chip size="small" label={`Desde ${fmtChip(gFromParam)}`}
              onDelete={() => { setGFrom(null); updateParams({ gfrom: undefined }); }} />
          )}
          <Chip size="small" variant="outlined"
            label={gToParam ? `Hasta ${fmtChip(gToParam)}` : 'Hasta ahora'}
            onDelete={gToParam ? () => { setGTo(null); updateParams({ gto: undefined }); } : undefined} />
        </Stack>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="subtitle1" gutterBottom>Evolución de umbrales de temperatura</Typography>
            {chartLoading ? (
              <Skeleton variant="rounded" height={260} />
            ) : points.length > 0 ? (
              <AreaLineChart height={260} mode="date" area={false} curve="stepAfter" labels={labels}
                onPointClick={(i) => setSelected(points[i] ?? null)}
                series={[
                  { id: 'tmin', label: 'T. mín', data: points.map((c) => c.temperatureMin), color: theme.palette.primary.main },
                  { id: 'tmax', label: 'T. máx', data: points.map((c) => c.temperatureMax), color: theme.palette.error.main },
                ]} />
            ) : (
              <EmptyState dense icon={<ShowChartRoundedIcon sx={{ fontSize: 30 }} />}
                title="Sin configuraciones en este rango" description="Ajustá el rango de fechas de los gráficos." />
            )}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="subtitle1" gutterBottom>Evolución de umbrales de humedad</Typography>
            {chartLoading ? (
              <Skeleton variant="rounded" height={260} />
            ) : points.length > 0 ? (
              <AreaLineChart height={260} mode="date" area={false} curve="stepAfter" labels={labels}
                onPointClick={(i) => setSelected(points[i] ?? null)}
                series={[
                  { id: 'hmin', label: 'H. mín', data: points.map((c) => c.humidityMin), color: theme.palette.secondary.main },
                  { id: 'hmax', label: 'H. máx', data: points.map((c) => c.humidityMax), color: theme.palette.warning.main },
                ]} />
            ) : (
              <EmptyState dense icon={<ShowChartRoundedIcon sx={{ fontSize: 30 }} />}
                title="Sin configuraciones en este rango" description="Ajustá el rango de fechas de los gráficos." />
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
        title="Detalle de configuración"
        onClose={() => setSelected(null)}
        rows={selected ? [
          { label: 'Fecha', value: new Date(selected.createdAt).toLocaleString() },
          { label: 'Nombre', value: selected.createdByName },
          { label: 'Email', value: selected.createdByEmail },
          { label: 'Temperatura mín / máx', value: `${selected.temperatureMin} / ${selected.temperatureMax} °C` },
          { label: 'Humedad mín / máx', value: `${selected.humidityMin} / ${selected.humidityMax} %` },
          { label: 'Histéresis T / H', value: `${selected.hysteresisTemperature} / ${selected.hysteresisHumidity}` },
          { label: 'Intervalo de medición', value: `${selected.measurementIntervalSeconds} s` },
          { label: 'Activa', value: selected.active ? 'Sí' : 'No' },
        ] : []}
      />
    </Box>
  );
}
