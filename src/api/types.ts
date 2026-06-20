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

export type EventSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export type EventType =
  | 'TEMP_OUT_OF_RANGE'
  | 'HUMIDITY_OUT_OF_RANGE'
  | 'CRITICAL'
  | 'RETURN_TO_NORMAL'
  | 'COOLER_ON'
  | 'COOLER_OFF';

export interface EventResponse {
  id: string;
  time: string;
  severity: EventSeverity;
  type: EventType;
  ackable: boolean;
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
