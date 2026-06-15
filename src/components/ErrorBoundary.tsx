import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Catches render-time crashes anywhere in the page tree and shows a friendly fallback instead
 * of a blank screen, with a button to recover without a full reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', p: 3 }}>
        <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 420 }}>
          <ReportProblemOutlinedIcon color="warning" sx={{ fontSize: 48 }} />
          <Typography variant="h6">Algo salió mal en esta vista</Typography>
          <Typography variant="body2" color="text.secondary">
            Ocurrió un error inesperado al renderizar. Podés reintentar; si persiste, recargá la página.
          </Typography>
          <Button variant="contained" onClick={() => this.setState({ error: null })}>Reintentar</Button>
        </Stack>
      </Box>
    );
  }
}
