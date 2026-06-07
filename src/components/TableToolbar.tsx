import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DensitySmallRoundedIcon from '@mui/icons-material/DensitySmallRounded';
import DensityMediumRoundedIcon from '@mui/icons-material/DensityMediumRounded';
import SwipeRoundedIcon from '@mui/icons-material/SwipeRounded';

/**
 * Small toolbar shown above a table: a density toggle (compact/comfortable) and a CSV export,
 * plus a swipe hint on phones (the table scrolls horizontally to reveal all columns).
 */
export function TableToolbar({ dense, onToggleDense, onExportCsv, exportDisabled }: {
  dense: boolean;
  onToggleDense: () => void;
  onExportCsv: () => void;
  exportDisabled?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
      <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
        <SwipeRoundedIcon fontSize="small" />
        <Typography variant="caption">Deslizá para ver más columnas</Typography>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
      <ToggleButtonGroup size="small" exclusive value={dense ? 'compact' : 'standard'}
        onChange={(_e, v) => { if (v && (v === 'compact') !== dense) onToggleDense(); }}>
        <Tooltip title="Cómoda">
          <ToggleButton value="standard" aria-label="Densidad cómoda"><DensityMediumRoundedIcon fontSize="small" /></ToggleButton>
        </Tooltip>
        <Tooltip title="Compacta">
          <ToggleButton value="compact" aria-label="Densidad compacta"><DensitySmallRoundedIcon fontSize="small" /></ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />}
        onClick={onExportCsv} disabled={exportDisabled}>
        CSV
      </Button>
      </Stack>
    </Stack>
  );
}
