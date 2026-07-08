import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ControlAnalytics } from './ControlAnalytics';
import type { ConfigResponse, MeasurementResponse } from '../api/types';

const mk = (temperature: number, humidity: number, coolerOn: boolean, createdAt: string): MeasurementResponse => ({
  id: createdAt, temperature, humidity, coolerOn, relayOn: false, status: 'NORMAL', createdAt,
});

const cfg = (temperatureMin: number, temperatureMax: number, createdAt: string, active = false): ConfigResponse => ({
  id: createdAt, temperatureMin, temperatureMax, humidityMin: 0, humidityMax: 100,
  hysteresisTemperature: 1, hysteresisHumidity: 1, measurementIntervalSeconds: 4,
  createdByName: 'test', createdByEmail: 'test@test.com', active, createdAt,
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

  it('judges each reading against the config active at its time', () => {
    // Band moved from [10,20] to [30,40] between the two readings. Each reading sits inside the
    // band that governed it, so per-period judging reads 100 % — judging both by the CURRENT
    // config (30-40) would wrongly read 50 %.
    const oldCfg = cfg(10, 20, '2026-06-07T09:00:00Z');
    const newCfg = cfg(30, 40, '2026-06-07T11:30:00Z', true);
    const points = [
      mk(15, 50, false, '2026-06-07T10:00:00Z'), // inside the old band
      mk(35, 50, false, '2026-06-07T12:00:00Z'), // inside the new band
    ];
    render(<ControlAnalytics points={points} config={newCfg} configs={[newCfg, oldCfg]} />);
    expect(screen.getByText('Temp en banda')).toBeInTheDocument();
    // Temp en banda and Humedad en banda both read 100 %.
    expect(screen.getAllByText('100,0 %').length).toBeGreaterThanOrEqual(2);
    // "Fuera de rango" reads 0 % under per-period judging (cooler duty is also 0 % here).
    expect(screen.getAllByText('0,0 %').length).toBeGreaterThanOrEqual(1);
  });
});
