import { describe, expect, it } from 'vitest';
import type { LocalEvent, LocalEventPreferences } from '../types';
import { isLaterToday, isThisWeekend, nearestWeekendDateKeys, scoreLocalEvent } from '../services/localEventRecommendationService';

const preferences: LocalEventPreferences = { radius: 50, reactions: {}, seen: [] };
const event: LocalEvent = {
  id: 'festival',
  title: 'River Festival',
  date: '2026-09-05',
  time: '11:00 AM',
  location: 'City Park',
  description: '',
  categories: ['family', 'festival', 'outdoors'],
  isOutdoor: true,
  price: 'Free',
};

describe('Hearth event scoring', () => {
  const now = new Date(2026, 8, 4, 9);
  const weather = [{ day: 'Fri', temp: 74, condition: 'partly-cloudy' as const }, { day: 'Sat', temp: 76, condition: 'sunny' as const }];

  it('boosts a free, family-friendly outdoor event when the calendar is open and weather is good', () => {
    const recommendation = scoreLocalEvent(event, [], weather, preferences, now);
    expect(recommendation.score).toBeGreaterThan(80);
    expect(recommendation.hasConflict).toBe(false);
    expect(recommendation.reasons).toContain('Calendar is open');
  });

  it('penalizes time conflicts while keeping the conflict explanation visible', () => {
    const recommendation = scoreLocalEvent(event, [{ id: 1, title: 'Practice', date: event.date, time: '12 PM', color: 'bg-blue-500', source: 'family' }], weather, preferences, now);
    expect(recommendation.score).toBeLessThan(80);
    expect(recommendation.hasConflict).toBe(true);
    expect(recommendation.reasons).toContain('Calendar conflict');
  });

  it('keeps Tonight limited to events that have not started and finds the nearest weekend', () => {
    const todayEvent = { ...event, date: '2026-09-04', time: '8:00 PM' };
    const pastEvent = { ...event, date: '2026-09-04', time: '8:00 AM' };
    const now = new Date(2026, 8, 4, 9, 30);
    expect(isLaterToday(todayEvent, now)).toBe(true);
    expect(isLaterToday(pastEvent, now)).toBe(false);
    expect(nearestWeekendDateKeys(now)).toEqual({ saturday: '2026-09-05', sunday: '2026-09-06' });
  });

  it('keeps Sunday in the active weekend instead of jumping to the following week', () => {
    const sundayMorning = new Date(2026, 8, 6, 9);
    expect(nearestWeekendDateKeys(sundayMorning)).toEqual({ saturday: '', sunday: '2026-09-06' });
    expect(isThisWeekend('2026-09-06', sundayMorning)).toBe(true);
    expect(isThisWeekend('2026-09-12', sundayMorning)).toBe(false);
  });
});
