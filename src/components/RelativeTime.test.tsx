import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RelativeTime } from './RelativeTime';
import { formatRelative } from '../lib/time';

describe('RelativeTime', () => {
  it('renders the relative format of the given timestamp', () => {
    const value = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
    render(<RelativeTime value={value} />);
    expect(screen.getByText(formatRelative(value))).toBeInTheDocument();
  });

  it('updates the displayed text when the value changes', () => {
    const { rerender } = render(<RelativeTime value={new Date(Date.now() - 60 * 1000).toISOString()} />);
    const fresh = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
    rerender(<RelativeTime value={fresh} />);
    expect(screen.getByText(formatRelative(fresh))).toBeInTheDocument();
  });
});
