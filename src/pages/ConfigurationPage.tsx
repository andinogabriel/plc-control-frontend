import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, Alert, Stack, Divider,
  InputAdornment, IconButton, Tooltip, Chip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import ArrowRightAltRoundedIcon from '@mui/icons-material/ArrowRightAltRounded';
import { AxiosError } from 'axios';
import { configApi } from '../api/configApi';
import { useToast } from '../components/toast';
import { HysteresisDiagram } from '../components/HysteresisDiagram';
import type { ApiError, ConfigRequest } from '../api/types';

// Empty input ('' / null / undefined) -> undefined so z.number reports "requerido".
const toNumber = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v));

const requiredNumber = (apply: (n: z.ZodNumber) => z.ZodNumber) =>
  z.preprocess(
    toNumber,
    apply(z.number({ required_error: 'Campo obligatorio', invalid_type_error: 'Número inválido' })),
  );

const schema = z
  .object({
    createdByName: z.string().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
    createdByEmail: z.string().email('Email inválido').max(150, 'Máximo 150 caracteres'),
    temperatureMin: requiredNumber((n) => n.min(-10, 'Mín -10 °C').max(60, 'Máx 60 °C')),
    temperatureMax: requiredNumber((n) => n.min(-10, 'Mín -10 °C').max(60, 'Máx 60 °C')),
    humidityMin: requiredNumber((n) => n.min(0, 'Mín 0 %').max(100, 'Máx 100 %')),
    humidityMax: requiredNumber((n) => n.min(0, 'Mín 0 %').max(100, 'Máx 100 %')),
    hysteresisTemperature: requiredNumber((n) => n.min(0.1, 'Mín 0,1 °C').max(2, 'Máx 2 °C')),
    hysteresisHumidity: requiredNumber((n) => n.min(0.1, 'Mín 0,1 %').max(5, 'Máx 5 %')),
    measurementIntervalSeconds: requiredNumber((n) => n.int('Debe ser un entero').min(5, 'Mín 5 s').max(1800, 'Máx 1800 s (30 min)')),
  })
  .refine((d) => d.temperatureMin == null || d.temperatureMax == null || d.temperatureMin < d.temperatureMax, {
    message: 'La temperatura mínima debe ser menor que la máxima',
    path: ['temperatureMin'],
  })
  .refine((d) => d.humidityMin == null || d.humidityMax == null || d.humidityMin < d.humidityMax, {
    message: 'La humedad mínima debe ser menor que la máxima',
    path: ['humidityMin'],
  });

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const HYSTERESIS_HELP =
  'Histéresis: banda muerta alrededor del umbral que evita que el cooler se prenda y apague '
  + 'constantemente cuando la lectura oscila cerca del límite. El cooler enciende al alcanzar el '
  + 'máximo y recién apaga al bajar a (máximo − histéresis).';

const fields: { name: keyof FormValues; label: string; help?: string }[] = [
  { name: 'temperatureMin', label: 'Temperatura mín (°C)' },
  { name: 'temperatureMax', label: 'Temperatura máx (°C)' },
  { name: 'humidityMin', label: 'Humedad mín (%)' },
  { name: 'humidityMax', label: 'Humedad máx (%)' },
  { name: 'hysteresisTemperature', label: 'Histéresis temperatura', help: `${HYSTERESIS_HELP} (en °C)` },
  { name: 'hysteresisHumidity', label: 'Histéresis humedad', help: `${HYSTERESIS_HELP} (en %)` },
  { name: 'measurementIntervalSeconds', label: 'Intervalo de medición (s)' },
];

const EMPTY_DEFAULTS: FormInput = {
  createdByName: '', createdByEmail: '',
  temperatureMin: undefined, temperatureMax: undefined,
  humidityMin: undefined, humidityMax: undefined,
  hysteresisTemperature: undefined, hysteresisHumidity: undefined,
  measurementIntervalSeconds: 20,
};

const num = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v));

export function ConfigurationPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: latest } = useQuery({ queryKey: ['config-latest'], queryFn: configApi.getLatest, retry: false });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const fingerprint = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`;
      const payload: ConfigRequest = { ...values, deviceFingerprint: fingerprint };
      return configApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-latest'] });
      queryClient.invalidateQueries({ queryKey: ['config-history'] });
      toast('Configuración guardada correctamente', 'success');
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiError>;
      const message = axiosError.response?.status === 429
        ? 'Demasiadas solicitudes (429). Esperá un momento antes de reintentar.'
        : axiosError.response?.data?.message ?? 'Error al guardar la configuración';
      toast(message, 'error');
    },
  });

  const serverError = mutation.error as AxiosError<ApiError> | null;

  const prefillFromActive = () => {
    if (!latest) return;
    reset({
      createdByName: latest.createdByName,
      createdByEmail: latest.createdByEmail,
      temperatureMin: latest.temperatureMin,
      temperatureMax: latest.temperatureMax,
      humidityMin: latest.humidityMin,
      humidityMax: latest.humidityMax,
      hysteresisTemperature: latest.hysteresisTemperature,
      hysteresisHumidity: latest.hysteresisHumidity,
      measurementIntervalSeconds: latest.measurementIntervalSeconds,
    });
    toast('Cargué los valores de la configuración activa', 'info');
  };

  // Live values for the preview/diff panel.
  const w = watch();
  // After a programmatic reset(), MUI's floating label doesn't auto-shrink for uncontrolled
  // inputs. Force shrink when the watched value is non-empty; undefined keeps MUI's focus auto.
  const shrink = (name: keyof FormInput) => {
    const val = w[name];
    return { shrink: val !== undefined && val !== '' ? true : undefined };
  };
  const v = {
    temperatureMin: num(w.temperatureMin), temperatureMax: num(w.temperatureMax),
    humidityMin: num(w.humidityMin), humidityMax: num(w.humidityMax),
    hysteresisTemperature: num(w.hysteresisTemperature), hysteresisHumidity: num(w.hysteresisHumidity),
    measurementIntervalSeconds: num(w.measurementIntervalSeconds),
  };

  const diffRows = latest ? ([
    ['Temp. mín', latest.temperatureMin, v.temperatureMin, '°C'],
    ['Temp. máx', latest.temperatureMax, v.temperatureMax, '°C'],
    ['Hum. mín', latest.humidityMin, v.humidityMin, '%'],
    ['Hum. máx', latest.humidityMax, v.humidityMax, '%'],
    ['Hist. temp.', latest.hysteresisTemperature, v.hysteresisTemperature, '°C'],
    ['Hist. hum.', latest.hysteresisHumidity, v.hysteresisHumidity, '%'],
    ['Intervalo', latest.measurementIntervalSeconds, v.measurementIntervalSeconds, 's'],
  ] as [string, number, number | undefined, string][])
    .filter(([, before, after]) => after != null && after !== before) : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Configuración de umbrales</Typography>

      {latest && (
        <Alert severity="info" sx={{ mb: 2 }} action={(
          <Button color="inherit" size="small" startIcon={<RestartAltRoundedIcon />} onClick={prefillFromActive}>
            Cargar config activa
          </Button>
        )}>
          Config activa: T [{latest.temperatureMin}–{latest.temperatureMax} °C],
          H [{latest.humidityMin}–{latest.humidityMax} %] · cada {latest.measurementIntervalSeconds} s · por {latest.createdByName}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit((vals) => mutation.mutate(vals))}>
                <Typography variant="subtitle1" gutterBottom>Datos del usuario</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Nombre" {...register('createdByName')}
                      InputLabelProps={shrink('createdByName')}
                      error={!!errors.createdByName} helperText={errors.createdByName?.message} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Email" {...register('createdByEmail')}
                      InputLabelProps={shrink('createdByEmail')}
                      error={!!errors.createdByEmail} helperText={errors.createdByEmail?.message} />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" gutterBottom>Umbrales</Typography>
                <Grid container spacing={2}>
                  {fields.map((f) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={f.name}>
                      <TextField fullWidth type="number" inputProps={{ step: 'any' }}
                        label={f.label} {...register(f.name)}
                        InputLabelProps={shrink(f.name)}
                        error={!!errors[f.name]} helperText={errors[f.name]?.message}
                        InputProps={f.help ? {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip title={f.help} arrow enterTouchDelay={0}
                                slotProps={{ tooltip: { sx: { maxWidth: 280 } } }}>
                                <IconButton edge="end" size="small" tabIndex={-1} aria-label="¿Qué es la histéresis?">
                                  <InfoOutlinedIcon fontSize="small" color="action" />
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          ),
                        } : undefined} />
                    </Grid>
                  ))}
                </Grid>

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end" mt={3}>
                  <Button type="submit" variant="contained"
                    loading={mutation.isPending} loadingPosition="start" startIcon={<SaveRoundedIcon />}>
                    Guardar configuración
                  </Button>
                </Stack>

                {serverError?.response?.data?.details && serverError.response.data.details.length > 0 && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {serverError.response.data.details.map((d) => (
                      <div key={d}>· {d}</div>
                    ))}
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Vista previa del cooler</Typography>
                <Stack spacing={2}>
                  <HysteresisDiagram label="Temperatura" unit=" °C"
                    min={v.temperatureMin} max={v.temperatureMax} hysteresis={v.hysteresisTemperature} />
                  <HysteresisDiagram label="Humedad" unit=" %"
                    min={v.humidityMin} max={v.humidityMax} hysteresis={v.hysteresisHumidity} />
                  {v.measurementIntervalSeconds != null && (
                    <Typography variant="caption" color="text.secondary">
                      La Raspberry medirá y reportará cada <b>{v.measurementIntervalSeconds} s</b>.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {latest && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Cambios vs config activa</Typography>
                  {diffRows.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Sin cambios todavía. Editá un umbral o usá “Cargar config activa”.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {diffRows.map(([label, before, after, unit]) => (
                        <Stack key={label} direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          <Typography variant="body2" sx={{ minWidth: 96 }}>{label}</Typography>
                          <Chip size="small" variant="outlined" label={`${before}${unit}`} />
                          <ArrowRightAltRoundedIcon fontSize="small" color="action" />
                          <Chip size="small" color="primary" label={`${after}${unit}`} />
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
