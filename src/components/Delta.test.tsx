import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Delta } from './Delta';

describe('Delta', () => {
  it('shows the magnitude with unit (comma decimal) when rising', () => {
    render(<Delta value={0.7} unit="°C" />);
    expect(screen.getByText(/0,7\s*°C/)).toBeInTheDocument();
  });

  it('shows the absolute magnitude when falling', () => {
    render(<Delta value={-1.2} unit="%" />);
    expect(screen.getByText(/1,2\s*%/)).toBeInTheDocument();
  });
});
