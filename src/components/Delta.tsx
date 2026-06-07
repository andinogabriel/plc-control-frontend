import { Box, Typography } from '@mui/material';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';

/**
 * Compact change indicator versus the previous reading: an up/down/flat arrow with the signed
 * difference. Colour is neutral (this is a sensor reading, not a "good/bad" metric).
 */
export function Delta({ value, unit, fractionDigits = 1 }: {
  value: number;
  unit: string;
  fractionDigits?: number;
}) {
  const rounded = Number(value.toFixed(fractionDigits));
  const direction = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';
  const Icon = direction === 'up' ? ArrowUpwardRoundedIcon
    : direction === 'down' ? ArrowDownwardRoundedIcon : RemoveRoundedIcon;
  const color = direction === 'up' ? 'warning.main'
    : direction === 'down' ? 'info.main' : 'text.disabled';

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, color }}>
      <Icon sx={{ fontSize: 16 }} />
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {Math.abs(rounded).toFixed(fractionDigits)} {unit}
      </Typography>
    </Box>
  );
}
