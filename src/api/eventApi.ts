import { apiClient } from './client';
import type { EventResponse, PageResponse } from './types';

export interface EventQuery {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
}

export type EventWindow = Pick<EventQuery, 'from' | 'to'>;

export const eventApi = {
  getEvents: async (params: EventQuery): Promise<PageResponse<EventResponse>> => {
    const { data } = await apiClient.get<PageResponse<EventResponse>>('/api/events', { params });
    return data;
  },

  getUnacknowledgedCount: async (params: EventWindow = {}): Promise<number> => {
    const { data } = await apiClient.get<{ unacknowledged: number }>('/api/events/unacknowledged-count', { params });
    return data.unacknowledged;
  },

  ackEvent: async (id: string): Promise<void> => {
    await apiClient.post(`/api/events/${id}/ack`);
  },

  ackAll: async (params: EventWindow = {}): Promise<void> => {
    await apiClient.post('/api/events/ack-all', null, { params });
  },
};
