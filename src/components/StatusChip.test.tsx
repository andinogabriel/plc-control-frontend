import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChip } from './StatusChip';

describe('StatusChip', () => {
  it('shows the Spanish label for each status', () => {
    render(<StatusChip status="NORMAL" />);
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('maps WARNING_TEMP to "Alerta temperatura"', () => {
    render(<StatusChip status="WARNING_TEMP" />);
    expect(screen.getByText('Alerta temperatura')).toBeInTheDocument();
  });

  it('falls back to the raw value for unknown statuses', () => {
    render(<StatusChip status="SOMETHING_ELSE" />);
    expect(screen.getByText('SOMETHING_ELSE')).toBeInTheDocument();
  });
});
