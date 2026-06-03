import { apiClient } from './client';
import type { ConfigRequest, ConfigResponse, PageResponse } from './types';

export interface ConfigHistoryQuery {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
  // Case- and accent-insensitive "contains" filters (resolved server-side).
  createdByName?: string;
  createdByEmail?: string;
  // Exact-match numeric filters on the stored thresholds.
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
}

export const configApi = {
  create: async (payload: ConfigRequest): Promise<ConfigResponse> => {
    const { data } = await apiClient.post<ConfigResponse>('/api/config', payload);
    return data;
  },

  getLatest: async (): Promise<ConfigResponse> => {
    const { data } = await apiClient.get<ConfigResponse>('/api/config/latest');
    return data;
  },

  getHistory: async (params: ConfigHistoryQuery): Promise<PageResponse<ConfigResponse>> => {
    const { data } = await apiClient.get<PageResponse<ConfigResponse>>('/api/config/history', { params });
    return data;
  },
};
