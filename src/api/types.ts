export type SystemStatus = 'NORMAL' | 'WARNING_TEMP' | 'WARNING_HUMIDITY' | 'CRITICAL';

export interface ConfigResponse {
  id: string;
  temperatureMin: number;
  temperatureMax: number;
  humidityMin: number;
  humidityMax: number;
  hysteresisTemperature: number;
  hysteresisHumidity: number;
  measurementIntervalSeconds: number;
  createdByName: string;
  createdByEmail: string;
  clientIp: string;
  userAgent: string;
  deviceFingerprint?: string;
  active: boolean;
  createdAt: string;
}

export interface ConfigRequest {
  createdByName: string;
  createdByEmail: string;
  temperatureMin: number;
  temperatureMax: number;
  humidityMin: number;
  humidityMax: number;
  hysteresisTemperature: number;
  hysteresisHumidity: number;
  measurementIntervalSeconds: number;
  deviceFingerprint?: string;
}

export interface MeasurementResponse {
  id: string;
  temperature: number;
  humidity: number;
  coolerOn: boolean;
  relayOn: boolean;
  status: SystemStatus;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  details: string[];
}
