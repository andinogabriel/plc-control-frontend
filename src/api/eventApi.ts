import { apiClient } from './client';
import type { EventResponse, PageResponse } from './types';

export interface EventQuery {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
}

export const eventApi = {
  getEvents: async (params: EventQuery): Promise<PageResponse<EventResponse>> => {
    const { data } = await apiClient.get<PageResponse<EventResponse>>('/api/events', { params });
    return data;
  },
};
