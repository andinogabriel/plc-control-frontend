import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDensity } from './useDensity';

describe('useDensity', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to comfortable and toggles + persists the choice', () => {
    const { result } = renderHook(() => useDensity());
    expect(result.current[0]).toBe(false);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem('tableDensity')).toBe('compact');

    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem('tableDensity')).toBe('standard');
  });

  it('reads the persisted value on init', () => {
    localStorage.setItem('tableDensity', 'compact');
    const { result } = renderHook(() => useDensity());
    expect(result.current[0]).toBe(true);
  });
});
