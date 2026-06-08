import type { ReactNode } from 'react';
import {
  Box, Card, CardActionArea, CardContent, Divider, IconButton, Skeleton, Stack, Typography,
} from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

export interface CardField { label: string; value: ReactNode }
export interface CardModel { title: ReactNode; fields: CardField[] }

/**
 * Phone-friendly alternative to the DataGrid: each row becomes a card with its fields stacked,
 * avoiding horizontal scrolling. Tapping a card opens the same detail dialog as the table.
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
  const gridSx = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 } as const;

  if (loading && rows.length === 0) {
    return (
      <Box sx={gridSx}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={120} />)}
      </Box>
    );
  }

  if (rows.length === 0) return <Box>{empty}</Box>;

  return (
    <Box>
      <Box sx={gridSx}>
      {rows.map((row, idx) => {
        const card = getCard(row);
        const content = (
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{card.title}</Typography>
            <Stack divider={<Divider flexItem />} spacing={0.75}>
              {card.fields.map((f) => (
                <Stack key={f.label} direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Typography variant="caption" color="text.secondary">{f.label}</Typography>
                  <Box sx={{ textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{f.value}</Box>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        );
        return (
          <Card key={idx}>
            {onRowClick ? <CardActionArea onClick={() => onRowClick(row)}>{content}</CardActionArea> : content}
          </Card>
        );
      })}
      </Box>

      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ pt: 1.5 }}>
        <IconButton size="small" aria-label="Página anterior" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftRoundedIcon />
        </IconButton>
        <Typography variant="body2">{page + 1} de {pageCount}</Typography>
        <IconButton size="small" aria-label="Página siguiente" disabled={page + 1 >= pageCount} onClick={() => onPageChange(page + 1)}>
          <ChevronRightRoundedIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
