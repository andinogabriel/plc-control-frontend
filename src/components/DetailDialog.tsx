import type { ReactNode } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography,
} from '@mui/material';

export interface DetailRow {
  label: string;
  value: ReactNode;
}

/** Generic detail dialog: a titled list of label/value rows. */
export function DetailDialog({ open, title, rows, onClose }: {
  open: boolean; title: string; rows: DetailRow[]; onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack divider={<Divider flexItem />} spacing={1.25}>
          {rows.map((r) => (
            <Stack key={r.label} direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Typography variant="body2" color="text.secondary">{r.label}</Typography>
              <Typography variant="body2" fontWeight={600} component="div" sx={{ textAlign: 'right' }}>
                {r.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
