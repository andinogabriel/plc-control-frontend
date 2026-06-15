import { useRef, type ReactNode } from 'react';
import {
  Box, Card, CardActionArea, CardContent, Divider, IconButton, Skeleton, Stack, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

export interface CardField { label: string; value: ReactNode }
export interface CardModel { title: ReactNode; fields: CardField[] }

// Above this many rows the list is window-virtualized (only visible cards are in the DOM).
const VIRTUALIZE_THRESHOLD = 24;

/**
 * Phone-friendly alternative to the DataGrid: each row becomes a card with its fields stacked,
 * avoiding horizontal scrolling. Lays out in 1 (xs) or 2 (md+) columns, and window-virtualizes
 * large pages so big page sizes stay smooth. Tapping a card opens the detail dialog.
 */
export function MobileCardList<T>({ rows, getCard, onRowClick, loading, empty, page, pageCount, onPageChange }: {
  rows: T[];
  getCard: (row: T) => CardModel;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: ReactNode;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const theme = useTheme();
  const lanes = useMediaQuery(theme.breakpoints.up('md')) ? 2 : 1;
  const gridSx = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 } as const;

  const renderCard = (row: T, idx: number) => {
    const card = getCard(row);
    const content = (
      <CardContent sx={{ py: 1.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{card.title}</Typography>
        <Stack divider={<Divider flexItem />} spacing={0.75}>
          {card.fields.map((f) => (
            <Stack key={f.label} direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">{f.label}</Typography>
              <Box sx={{ textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{f.value}</Box>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    );
    return (
      <Card key={idx} sx={{ height: '100%' }}>
        {onRowClick ? <CardActionArea onClick={() => onRowClick(row)} sx={{ height: '100%' }}>{content}</CardActionArea> : content}
      </Card>
    );
  };

  const pager = (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', pt: 1.5 }}>
      <IconButton size="small" aria-label="Página anterior" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
        <ChevronLeftRoundedIcon />
      </IconButton>
      <Typography variant="body2">{page + 1} de {pageCount}</Typography>
      <IconButton size="small" aria-label="Página siguiente" disabled={page + 1 >= pageCount} onClick={() => onPageChange(page + 1)}>
        <ChevronRightRoundedIcon />
      </IconButton>
    </Stack>
  );

  if (loading && rows.length === 0) {
    return (
      <Box sx={gridSx}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={120} />)}
      </Box>
    );
  }

  if (rows.length === 0) return <Box>{empty}</Box>;

  if (rows.length > VIRTUALIZE_THRESHOLD) {
    return <VirtualCardGrid rows={rows} lanes={lanes} renderCard={renderCard} pager={pager} />;
  }

  return (
    <Box>
      <Box sx={gridSx}>{rows.map((row, idx) => renderCard(row, idx))}</Box>
      {pager}
    </Box>
  );
}

/** Window-virtualized multi-lane card grid for large pages. */
function VirtualCardGrid<T>({ rows, lanes, renderCard, pager }: {
  rows: T[]; lanes: number; renderCard: (row: T, idx: number) => ReactNode; pager: ReactNode;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 160,
    overscan: 6,
    lanes,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  return (
    <Box>
      <div ref={parentRef}>
        <Box sx={{ position: 'relative', width: '100%', height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((vi) => (
            <Box
              key={vi.key}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              sx={{
                position: 'absolute', top: 0,
                left: `${(vi.lane / lanes) * 100}%`,
                width: `${100 / lanes}%`,
                transform: `translateY(${vi.start - virtualizer.options.scrollMargin}px)`,
                pr: vi.lane < lanes - 1 ? 1.5 : 0,
                pb: 1.5,
                boxSizing: 'border-box',
              }}
            >
              {renderCard(rows[vi.index], vi.index)}
            </Box>
          ))}
        </Box>
      </div>
      {pager}
    </Box>
  );
}
