import { Box } from '@mui/material';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

/**
 * Tiny inline trend chart for the dashboard KPI cards. Renders nothing with fewer than two
 * points (a single value has no trend to show).
 */
export function Sparkline({ data, color, height = 38 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  return (
    <Box sx={{ width: '100%' }}>
      <SparkLineChart
        data={data}
        height={height}
        color={color}
        area
        curve="monotoneX"
        showHighlight
        showTooltip={false}
        sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 } }}
      />
    </Box>
  );
}
