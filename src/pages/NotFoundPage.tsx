import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import { LCD_SCREEN, MONO_FONT } from '../theme';

/**
 * 404 route, rendered by the catch-all inside the app shell so the navigation stays available.
 * Matches the instrument/SCADA language: a recessed LCD "404" readout (like a faulted display),
 * a cyan accent and mono type. Offers "back" — only when there is in-app history to return to —
 * and "home" (the dashboard).
 */
export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // react-router assigns the very first history entry the key "default"; any other value means the
  // user arrived here from a valid in-app page, so going back is meaningful (otherwise it would
  // leave the app). We only offer "Volver" in that case.
  const canGoBack = location.key !== 'default';

  return (
    <Stack
      spacing={3}
      sx={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '60vh', px: 2 }}
    >
      {/* Recessed LCD readout with the code, like a faulted instrument display. */}
      <Box
        sx={{
          position: 'relative',
          px: { xs: 4, sm: 6 },
          py: { xs: 2.5, sm: 3.5 },
          borderRadius: 2,
          backgroundColor: LCD_SCREEN,
          border: `1px solid ${alpha('#22d3ee', 0.25)}`,
          boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6)',
        }}
      >
        <SearchOffOutlinedIcon
          sx={{ position: 'absolute', top: 10, right: 10, fontSize: 18, color: alpha('#e5e7eb', 0.35) }}
        />
        <Typography
          component="div"
          sx={{
            fontFamily: MONO_FONT,
            fontWeight: 700,
            lineHeight: 1,
            fontSize: { xs: 64, sm: 92 },
            letterSpacing: '0.08em',
            color: '#f1f5f9',
            textShadow: '0 0 18px rgba(34,211,238,0.35)',
          }}
        >
          404
        </Typography>
        <Typography
          sx={{ fontFamily: MONO_FONT, fontSize: 12, letterSpacing: '0.22em', color: alpha('#e5e7eb', 0.6), mt: 1 }}
        >
          PAGINA NO ENCONTRADA
        </Typography>
      </Box>

      <Stack spacing={0.75} sx={{ maxWidth: 460 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Esta ruta no existe
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No encontramos la página que buscás. Puede que el enlace esté mal escrito o que la sección
          ya no esté disponible.
        </Typography>
        <Typography
          sx={{ fontFamily: MONO_FONT, fontSize: 12, color: 'text.secondary', mt: 0.5, wordBreak: 'break-all' }}
        >
          {location.pathname}
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {canGoBack && (
          <Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(-1)}>
            Volver
          </Button>
        )}
        <Button variant="contained" startIcon={<HomeOutlinedIcon />} onClick={() => navigate('/tablero')}>
          Ir al tablero
        </Button>
      </Stack>
    </Stack>
  );
}
