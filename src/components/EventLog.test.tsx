import { describe, it, expect } from 'vitest';
import { EVENT_LABEL } from './EventLog';
import type { EventType } from '../api/types';

const ALL_TYPES: EventType[] = [
  'TEMP_OUT_OF_RANGE', 'HUMIDITY_OUT_OF_RANGE', 'CRITICAL',
  'RETURN_TO_NORMAL', 'COOLER_ON', 'COOLER_OFF', 'SENSOR_OFFLINE',
];

describe('EVENT_LABEL', () => {
  it('maps every backend event type to a non-empty tag and message', () => {
    for (const type of ALL_TYPES) {
      expect(EVENT_LABEL[type]?.tag).toBeTruthy();
      expect(EVENT_LABEL[type]?.message).toBeTruthy();
    }
  });

  it('uses instrument tags for the out-of-range alarms', () => {
    expect(EVENT_LABEL.TEMP_OUT_OF_RANGE.tag).toBe('TT-01');
    expect(EVENT_LABEL.HUMIDITY_OUT_OF_RANGE.tag).toBe('RH-01');
    expect(EVENT_LABEL.COOLER_ON.tag).toBe('FAN-01');
  });
});
