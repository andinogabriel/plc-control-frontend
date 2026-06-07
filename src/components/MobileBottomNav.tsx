import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const items = [
  { label: 'Tablero', path: '/tablero', icon: <SpaceDashboardIcon /> },
  { label: 'Config', path: '/configuracion', icon: <TuneIcon /> },
  { label: 'Historial', path: '/historial-configuracion', icon: <HistoryIcon /> },
  { label: 'Mediciones', path: '/mediciones', icon: <ShowChartIcon /> },
];

/** Thumb-friendly bottom navigation, shown only on phones (xs). */
export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = items.findIndex((i) => i.path === location.pathname);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: { xs: 'block', md: 'none' },
        zIndex: (t) => t.zIndex.appBar,
        borderTop: '1px solid', borderColor: 'divider',
        // Respect iOS safe-area so the bar isn't under the home indicator.
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={current === -1 ? 0 : current}
        onChange={(_, i) => navigate(items[i].path)}
      >
        {items.map((i) => (
          <BottomNavigationAction key={i.path} label={i.label} icon={i.icon}
            sx={{ minWidth: 0, px: 0.5, '& .MuiBottomNavigationAction-label': { fontSize: 11 } }} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
