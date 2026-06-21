import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import {
  Box, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MONO_FONT } from '../theme';

export interface DetailRow {
  label: string;
  value: ReactNode;
}

/** Detail dialog: titled list of label/value rows. Draggable by its header, closed with the
 *  top-right X (no bottom button). */
export function DetailDialog({ open, title, rows, onClose }: {
  open: boolean; title: string; rows: DetailRow[]; onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    startX: number; startY: number; origX: number; origY: number; rect: DOMRect | null;
  } | null>(null);

  // Re-center each time it opens.
  useEffect(() => { if (open) setPos({ x: 0, y: 0 }); }, [open]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const paper = e.currentTarget.closest('.MuiDialog-paper') as HTMLElement | null;
    drag.current = {
      startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y,
      rect: paper ? paper.getBoundingClientRect() : null,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    let x = d.origX + (e.clientX - d.startX);
    let y = d.origY + (e.clientY - d.startY);
    // Clamp so the dialog never leaves the viewport.
    if (d.rect) {
      const margin = 8;
      const minX = d.origX - d.rect.left + margin;
      const maxX = d.origX + (window.innerWidth - d.rect.right) - margin;
      const minY = d.origY - d.rect.top + margin;
      const maxY = d.origY + (window.innerHeight - d.rect.bottom) - margin;
      x = Math.min(Math.max(x, minX), maxX);
      y = Math.min(Math.max(y, minY), maxY);
    }
    setPos({ x, y });
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
      slotProps={{ paper: { sx: { transform: fullScreen ? 'none' : `translate(${pos.x}px, ${pos.y}px)` } } }}
    >
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, pl: 2.5, pr: 1 }}>
        <Box
          onPointerDown={fullScreen ? undefined : onPointerDown}
          onPointerMove={fullScreen ? undefined : onPointerMove}
          onPointerUp={fullScreen ? undefined : onPointerUp}
          sx={{ flexGrow: 1, cursor: fullScreen ? 'default' : 'move', userSelect: 'none', touchAction: 'none', fontWeight: 700, py: 1 }}
        >
          {title}
        </Box>
        <IconButton aria-label="Cerrar" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack divider={<Divider flexItem />} spacing={1.25}>
          {rows.map((r) => (
            <Stack key={r.label} direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">{r.label}</Typography>
              <Typography variant="body2" component="div"
                sx={{ fontFamily: MONO_FONT, fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                {r.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
