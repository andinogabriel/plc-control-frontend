import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, Alert, Stack, Divider,
  InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { AxiosError } from 'axios';
import { configApi } from '../api/configApi';
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
    createdByName: z.string().min(1, 'El nombre es obligatorio').max(100),
    createdByEmail: z.string().email('Email inválido').max(150),
    temperatureMin: requiredNumber((n) => n.min(-10, 'Mín -10 °C').max(60, 'Máx 60 °C')),
    temperatureMax: requiredNumber((n) => n.min(-10, 'Mín -10 °C').max(60, 'Máx 60 °C')),
    humidityMin: requiredNumber((n) => n.min(0, 'Mín 0%').max(100, 'Máx 100%')),
    humidityMax: requiredNumber((n) => n.min(0, 'Mín 0%').max(100, 'Máx 100%')),
    hysteresisTemperature: requiredNumber((n) => n.positive('Debe ser positiva').max(20)),
    hysteresisHumidity: requiredNumber((n) => n.positive('Debe ser positiva').max(20)),
    measurementIntervalSeconds: requiredNumber((n) => n.int('Debe ser un entero').min(5, 'Mín 5 s').max(3600, 'Máx 3600 s')),
  })
  .refine((d) => d.temperatureMin == null || d.temperatureMax == null || d.temperatureMin < d.temperatureMax, {
    message: 'temperatureMin debe ser menor que temperatureMax',
    path: ['temperatureMin'],
  })
  .refine((d) => d.humidityMin == null || d.humidityMax == null || d.humidityMin < d.humidityMax, {
    message: 'humidityMin debe ser menor que humidityMax',
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

export function ConfigurationPage() {
  const queryClient = useQueryClient();
  const { data: latest } = useQuery({ queryKey: ['config-latest'], queryFn: configApi.getLatest, retry: false });

  const { register, handleSubmit, formState: { errors } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      createdByName: '', createdByEmail: '',
      temperatureMin: undefined, temperatureMax: undefined,
      humidityMin: undefined, humidityMax: undefined,
      hysteresisTemperature: undefined, hysteresisHumidity: undefined,
      measurementIntervalSeconds: 20,
    },
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
    },
  });

  const serverError = mutation.error as AxiosError<ApiError> | null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Configuración de umbrales</Typography>

      {latest && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Config activa: T [{latest.temperatureMin}–{latest.temperatureMax} °C],
          H [{latest.humidityMin}–{latest.humidityMax} %] · cada {latest.measurementIntervalSeconds} s · por {latest.createdByName}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
            <Typography variant="subtitle1" gutterBottom>Datos del usuario</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Nombre" {...register('createdByName')}
                  error={!!errors.createdByName} helperText={errors.createdByName?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Email" {...register('createdByEmail')}
                  error={!!errors.createdByEmail} helperText={errors.createdByEmail?.message} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" gutterBottom>Umbrales</Typography>
            <Grid container spacing={2}>
              {fields.map((f) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={f.name}>
                  <TextField fullWidth type="number" inputProps={{ step: 'any' }}
                    label={f.label} {...register(f.name)}
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
              {mutation.isSuccess && <Alert severity="success" sx={{ py: 0 }}>Configuración guardada</Alert>}
              <Button type="submit" variant="contained" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Guardar configuración'}
              </Button>
            </Stack>

            {serverError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {serverError.response?.status === 429
                  ? 'Demasiadas solicitudes (429). Esperá un momento antes de reintentar.'
                  : serverError.response?.data?.message ?? 'Error al guardar la configuración'}
                {serverError.response?.data?.details?.map((d) => (
                  <div key={d}>· {d}</div>
                ))}
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
