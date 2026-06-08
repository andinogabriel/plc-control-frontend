import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DensitySmallRoundedIcon from '@mui/icons-material/DensitySmallRounded';
import DensityMediumRoundedIcon from '@mui/icons-material/DensityMediumRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import ViewAgendaRoundedIcon from '@mui/icons-material/ViewAgendaRounded';
import type { ViewMode } from '../hooks/useViewMode';

/**
 * Toolbar above a table: a "Filtros" button on phones (the grid headers are hidden there, so
 * filtering/sorting moves into a bottom sheet), a table/cards view switch and density toggle
 * (desktop only — phones always use cards) and a CSV export (always available).
 */
export function TableToolbar({ dense, onToggleDense, onExportCsv, exportDisabled, onOpenFilters, viewMode, onSetViewMode }: {
  dense: boolean;
  onToggleDense: () => void;
  onExportCsv: () => void;
  exportDisabled?: boolean;
  onOpenFilters?: () => void;
  viewMode?: ViewMode;
  onSetViewMode?: (mode: ViewMode) => void;
}) {
  return (
    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ mb: 1.5 }}>
      {onOpenFilters && (
        <Button size="small" variant="outlined" startIcon={<FilterAltRoundedIcon />}
          onClick={onOpenFilters} sx={{ mr: 'auto' }}>
          Filtros
        </Button>
      )}
      {viewMode && onSetViewMode && (
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <ToggleButtonGroup size="small" exclusive value={viewMode}
            onChange={(_e, v) => { if (v) onSetViewMode(v as ViewMode); }}>
            <Tooltip title="Tabla">
              <ToggleButton value="table" aria-label="Vista de tabla"><TableRowsRoundedIcon fontSize="small" /></ToggleButton>
            </Tooltip>
            <Tooltip title="Tarjetas">
              <ToggleButton value="cards" aria-label="Vista de tarjetas"><ViewAgendaRoundedIcon fontSize="small" /></ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Box>
      )}
      {viewMode !== 'cards' && (
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
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
      )}
      <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />}
        onClick={onExportCsv} disabled={exportDisabled}>
        CSV
      </Button>
    </Stack>
  );
}
