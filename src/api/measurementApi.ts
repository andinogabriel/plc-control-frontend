import { apiClient } from './client';
import type { MeasurementResponse, PageResponse, SystemStatus } from './types';

export interface MeasurementQuery {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
  status?: SystemStatus;
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  coolerOn?: boolean;
  // Server-side sort, e.g. "temperature,asc".
  sort?: string;
  // Charts only: cap the series; if the range has more readings, the backend down-samples to
  // ~maxPoints spread across the whole range (so wide ranges show their full span, not the
  // most recent page).
  maxPoints?: number;
}

export const measurementApi = {
  getLatest: async (): Promise<MeasurementResponse> => {
    const { data } = await apiClient.get<MeasurementResponse>('/api/measurements/latest');
    return data;
  },

  getMeasurements: async (params: MeasurementQuery): Promise<PageResponse<MeasurementResponse>> => {
    const { data } = await apiClient.get<PageResponse<MeasurementResponse>>('/api/measurements', { params });
    return data;
  },
};
