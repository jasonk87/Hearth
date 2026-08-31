import { describe, expect, it } from 'vitest';
import { daysFromToday, normalizeEventDate, toLocalDateKey } from '../services/dateService';

describe('local calendar dates', () => {
  it('uses local calendar fields instead of converting through UTC', () => {
    const localDate = new Date(2026, 6, 27, 23, 30);
    expect(toLocalDateKey(localDate)).toBe('2026-07-27');
  });

  it('normalizes Google Events date labels into YYYY-MM-DD keys', () => {
    const now = new Date(2026, 6, 1, 12);
    expect(normalizeEventDate('Jul 27', now)).toBe('2026-07-27');
    expect(normalizeEventDate('Upcoming Saturday', now)).toBe('2026-07-04');
  });

  it('calculates relative days from local date keys', () => {
    expect(daysFromToday('2026-07-04', new Date(2026, 6, 1, 23))).toBe(3);
  });
});
