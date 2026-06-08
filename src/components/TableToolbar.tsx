import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DensitySmallRoundedIcon from '@mui/icons-material/DensitySmallRounded';
import DensityMediumRoundedIcon from '@mui/icons-material/DensityMediumRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';

/**
 * Toolbar above a table: a "Filtros" button on phones (the grid headers are hidden there, so
 * filtering/sorting moves into a bottom sheet), a density toggle (desktop only — phones use the
 * card list) and a CSV export (always available).
 */
export function TableToolbar({ dense, onToggleDense, onExportCsv, exportDisabled, onOpenFilters }: {
  dense: boolean;
  onToggleDense: () => void;
  onExportCsv: () => void;
  exportDisabled?: boolean;
  onOpenFilters?: () => void;
}) {
  return (
    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ mb: 1.5 }}>
      {onOpenFilters && (
        <Button size="small" variant="outlined" startIcon={<FilterAltRoundedIcon />}
          onClick={onOpenFilters} sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 'auto' }}>
          Filtros
        </Button>
      )}
      <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
        <ToggleButtonGroup size="small" exclusive value={dense ? 'compact' : 'standard'}
          onChange={(_e, v) => { if (v && (v === 'compact') !== dense) onToggleDense(); }}>
          <Tooltip title="Cómoda">
            <ToggleButton value="standard" aria-label="Densidad cómoda"><DensityMediumRoundedIcon fontSize="small" /></ToggleButton>
          </Tooltip>
          <Tooltip title="Compacta">
            <ToggleButton value="compact" aria-label="Densidad compacta"><DensitySmallRoundedIcon fontSize="small" /></ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Box>
      <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />}
        onClick={onExportCsv} disabled={exportDisabled}>
        CSV
      </Button>
    </Stack>
  );
}
