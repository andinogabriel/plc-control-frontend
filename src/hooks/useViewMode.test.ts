import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewMode } from './useViewMode';

describe('useViewMode', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to table and persists the chosen mode', () => {
    const { result } = renderHook(() => useViewMode());
    expect(result.current[0]).toBe('table');

    act(() => result.current[1]('cards'));
    expect(result.current[0]).toBe('cards');
    expect(localStorage.getItem('tableViewMode')).toBe('cards');

    act(() => result.current[1]('table'));
    expect(result.current[0]).toBe('table');
    expect(localStorage.getItem('tableViewMode')).toBe('table');
  });

  it('reads the persisted mode on init', () => {
    localStorage.setItem('tableViewMode', 'cards');
    const { result } = renderHook(() => useViewMode());
    expect(result.current[0]).toBe('cards');
  });
});
