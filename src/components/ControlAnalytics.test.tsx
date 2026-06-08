import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ControlAnalytics } from './ControlAnalytics';
import type { MeasurementResponse } from '../api/types';

const mk = (temperature: number, humidity: number, coolerOn: boolean, createdAt: string): MeasurementResponse => ({
  id: createdAt, temperature, humidity, coolerOn, relayOn: false, status: 'NORMAL', createdAt,
});

describe('ControlAnalytics', () => {
  it('renders averages and the cooler duty cycle', () => {
    const points = [
      mk(20, 40, false, '2026-06-07T10:00:00Z'),
      mk(22, 50, true, '2026-06-07T11:00:00Z'),
      mk(24, 60, true, '2026-06-07T12:00:00Z'),
    ];
    render(<ControlAnalytics points={points} />);
    expect(screen.getByText('Temp prom')).toBeInTheDocument();
    expect(screen.getByText('22,0 °C')).toBeInTheDocument(); // (20+22+24)/3
    expect(screen.getByText('66,7 %')).toBeInTheDocument(); // 2 of 3 readings with cooler on
  });

  it('renders nothing without points', () => {
    const { container } = render(<ControlAnalytics points={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
