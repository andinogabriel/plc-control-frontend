import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Dialog, InputBase, List, ListItemButton, ListItemIcon, ListItemText, Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import type { ReactNode } from 'react';
import { useColorMode } from '../colorMode';

interface Command { id: string; label: string; icon: ReactNode; run: () => void; keywords?: string }

/**
 * Quick-action launcher opened with Ctrl/Cmd+K: fuzzy-ish search over navigation and theme
 * actions, arrow keys to move, Enter to run.
 */
export function CommandPalette() {
  const navigate = useNavigate();
  const { setMode } = useColorMode();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = useMemo<Command[]>(() => {
    const go = (path: string) => () => { navigate(path); setOpen(false); };
    return [
      { id: 'dashboard', label: 'Ir a Dashboard', icon: <SpaceDashboardIcon />, run: go('/tablero'), keywords: 'tablero inicio' },
      { id: 'config', label: 'Ir a Configuración', icon: <TuneIcon />, run: go('/configuracion'), keywords: 'umbrales' },
      { id: 'config-history', label: 'Ir a Historial de configuraciones', icon: <HistoryIcon />, run: go('/historial-configuracion'), keywords: 'auditoria' },
      { id: 'measurements', label: 'Ir a Mediciones', icon: <ShowChartIcon />, run: go('/mediciones'), keywords: 'historial lecturas' },
      { id: 'light', label: 'Tema claro', icon: <LightModeIcon />, run: () => { setMode('light'); setOpen(false); } },
      { id: 'dark', label: 'Tema oscuro', icon: <DarkModeIcon />, run: () => { setMode('dark'); setOpen(false); } },
    ];
  }, [navigate, setMode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => { setActive(0); }, [query, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[active]?.run(); }
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { position: 'fixed', top: 80, m: 0, borderRadius: 3 } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <SearchRoundedIcon color="action" />
        <InputBase
          autoFocus fullWidth placeholder="Buscar acción o página…"
          value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
        />
        <Typography variant="caption" color="text.secondary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.75 }}>esc</Typography>
      </Box>
      <List sx={{ py: 0.5, maxHeight: 360, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Sin resultados</Typography>
        )}
        {filtered.map((c, i) => (
          <ListItemButton key={c.id} selected={i === active} onClick={c.run} onMouseEnter={() => setActive(i)}>
            <ListItemIcon sx={{ minWidth: 40 }}>{c.icon}</ListItemIcon>
            <ListItemText primary={c.label} />
          </ListItemButton>
        ))}
      </List>
    </Dialog>
  );
}
