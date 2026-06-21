import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AppBar, Box, Divider, Drawer, IconButton, Link as MuiLink, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import CheckIcon from '@mui/icons-material/Check';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useColorMode, type ColorMode } from '../colorMode';
import { eventApi } from '../api/eventApi';
import { BrandMark } from './BrandMark';
import { setFaviconAlarm } from '../lib/favicon';
import { MONO_FONT } from '../theme';
import { AlertCenter } from './AlertCenter';
import { CommandPalette } from './CommandPalette';
import { TopProgressBar } from './TopProgressBar';
import { MobileBottomNav } from './MobileBottomNav';
import { StatusBar } from './StatusBar';
import { MeasurementStream } from './MeasurementStream';
import { AcquisitionBar } from './AcquisitionBar';
import { OfflineBanner } from './OfflineBanner';
import { PullToRefresh } from './PullToRefresh';
import { useReducedMotion } from '../hooks/useReducedMotion';

const openCommandPalette = () =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));

const DRAWER_WIDTH = 240;

/** Concise per-route names for the browser tab title. */
const PAGE_TITLES: Record<string, string> = {
  '/tablero': 'Monitoreo',
  '/configuracion': 'Configuración',
  '/historial-configuracion': 'Historial de configuración',
  '/mediciones': 'Mediciones',
};

const navItems = [
  { label: 'Tablero', path: '/tablero', icon: <SpaceDashboardIcon /> },
  { label: 'Configuración', path: '/configuracion', icon: <TuneIcon /> },
  { label: 'Historial config', path: '/historial-configuracion', icon: <HistoryIcon /> },
  { label: 'Mediciones', path: '/mediciones', icon: <ShowChartIcon /> },
];

const MODE_OPTIONS: { value: ColorMode; label: string; icon: ReactNode }[] = [
  { value: 'light', label: 'Claro', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', label: 'Oscuro', icon: <DarkModeIcon fontSize="small" /> },
  { value: 'system', label: 'Sistema', icon: <SettingsBrightnessIcon fontSize="small" /> },
];

function ColorModeButton() {
  const { mode, setMode } = useColorMode();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const current = MODE_OPTIONS.find((o) => o.value === mode) ?? MODE_OPTIONS[2];
  return (
    <>
      <Tooltip title="Tema">
        <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)} aria-label="Cambiar tema">
          {current.icon}
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {MODE_OPTIONS.map((o) => (
          <MenuItem key={o.value} selected={o.value === mode}
            onClick={() => { setMode(o.value); setAnchor(null); }}>
            <ListItemIcon>{o.icon}</ListItemIcon>
            <ListItemText>{o.label}</ListItemText>
            {o.value === mode && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** Live plant clock for the status bar: a monospaced HH:MM:SS readout, like a console header. */
function PlantClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Box component="span" aria-hidden sx={{
      display: { xs: 'none', md: 'inline-flex' },
      fontFamily: MONO_FONT, fontSize: 13, fontWeight: 500,
      color: 'text.secondary', letterSpacing: '0.04em', mr: 1,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {now.toLocaleTimeString('es-AR', { hour12: false })}
    </Box>
  );
}

function Footer() {
  return (
    <Box component="footer" sx={{
      mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
    }}>
      <Box component="img" src="/uncaus-logo-color.svg" alt="UNCAUS" sx={{ height: 20, display: 'block' }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      <Typography variant="body2" color="text.secondary">
        Uncaus - Teoría de Control 2026
      </Typography>
      <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: 11, color: 'text.disabled' }}>
        v{__APP_VERSION__}
      </Typography>
    </Box>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = () => (isDesktop ? setDesktopOpen((o) => !o) : setMobileOpen((o) => !o));

  // Global unacknowledged-alarm count (shared cache with the event log). Surfaced in the tab title
  // so an operator sees pending alarms even from another tab — a control-room habit.
  const { data: unackedAlarms = 0 } = useQuery({
    queryKey: ['events-unacked'],
    queryFn: () => eventApi.getUnacknowledgedCount(),
    refetchInterval: 30000,
  });
  useEffect(() => {
    const base = 'Sistema de Control PLC';
    const page = PAGE_TITLES[location.pathname];
    const name = page ? `${page} · ${base}` : base;
    document.title = unackedAlarms > 0 ? `(${unackedAlarms}) ${name}` : name;
  }, [location.pathname, unackedAlarms]);
  useEffect(() => { setFaviconAlarm(unackedAlarms > 0); }, [unackedAlarms]);

  // Accessibility: on navigation, move focus to the main region so screen readers announce the
  // new page and keyboard users continue from the content (not the link they just left). Skip
  // the first render so the app does not steal focus on initial load.
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [location.pathname]);

  const navList = (
    <Box sx={{ height: '100%' }}>
      <Toolbar />
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2, mx: 1, my: 0.25, position: 'relative',
                // Leading accent bar on the active item, on top of the tinted background.
                '&.Mui-selected::before': {
                  content: '""', position: 'absolute', left: 3, top: '50%',
                  transform: 'translateY(-50%)', width: 3, height: '56%',
                  borderRadius: 4, backgroundColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const navWidth = isDesktop && desktopOpen ? DRAWER_WIDTH : 0;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <MuiLink
        href="#main-content"
        sx={{
          position: 'absolute', left: 8, top: -48, zIndex: (t) => t.zIndex.tooltip + 1,
          px: 2, py: 1, borderRadius: 1, bgcolor: 'primary.main', color: 'primary.contrastText',
          transition: 'top .15s', '&:focus': { top: 8 },
        }}
      >
        Saltar al contenido
      </MuiLink>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" aria-label="Abrir/cerrar menú"
            sx={{ mr: 1, display: { xs: 'none', md: 'inline-flex' } }}
            onClick={(e) => {
              // Blur the trigger so it doesn't keep focus inside #root once the mobile
              // drawer (a Modal) sets aria-hidden on it. MUI then moves focus into the drawer.
              e.currentTarget.blur();
              toggle();
            }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ mr: 1, display: 'flex' }}><BrandMark size={26} /></Box>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '0.02em' }}>
            {/* Full name on tablet+, short name on phones so it never truncates mid-word. */}
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sistema de Control PLC</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Control PLC</Box>
          </Typography>
          <PlantClock />
          <Tooltip title="Buscar (Ctrl/⌘ + K)">
            <IconButton color="inherit" onClick={openCommandPalette} aria-label="Abrir buscador">
              <SearchRoundedIcon />
            </IconButton>
          </Tooltip>
          <AlertCenter />
          <ColorModeButton />
        </Toolbar>
      </AppBar>
      <TopProgressBar />
      <CommandPalette />
      <MeasurementStream />

      <Box component="nav" sx={{ width: { md: navWidth }, flexShrink: 0, transition: theme.transitions.create('width') }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {navList}
        </Drawer>
        <Drawer
          variant="persistent"
          open={isDesktop && desktopOpen}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {navList}
        </Drawer>
      </Box>

      <Box component="main" id="main-content" ref={mainRef} tabIndex={-1}
        sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', outline: 'none', p: { xs: 2, md: 3 }, pb: { xs: 10, md: 6 } }}>
        <Toolbar />
        <AcquisitionBar />
        <Box className="no-print" sx={{ mb: 1 }}><OfflineBanner /></Box>
        <PullToRefresh>
          {/* Per-route enter transition: a subtle fade + upward slide. Keyed by pathname so it
              replays on navigation; disabled under reduced-motion. */}
          <Box
            key={location.pathname}
            sx={{
              flexGrow: 1,
              '@keyframes pageIn': {
                from: { opacity: 0, transform: 'translateY(8px)' },
                to: { opacity: 1, transform: 'none' },
              },
              animation: reducedMotion ? 'none' : 'pageIn 260ms ease',
            }}
          >
            {children}
          </Box>
        </PullToRefresh>
        <Footer />
      </Box>

      <MobileBottomNav />
      <StatusBar left={navWidth} />
    </Box>
  );
}
