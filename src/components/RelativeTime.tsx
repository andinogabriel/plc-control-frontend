import { useEffect, useState } from 'react';
import { Tooltip } from '@mui/material';
import { formatRelative } from '../lib/time';

/**
 * Shows a live relative timestamp ("hace 5 min") that refreshes once a minute, with the full
 * absolute date/time on hover. Used in table date columns.
 */
export function RelativeTime({ value }: { value: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <Tooltip title={new Date(value).toLocaleString()}>
      <span>{formatRelative(value)}</span>
    </Tooltip>
  );
}
