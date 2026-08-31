import type { CalendarEvent, LocalEvent, LocalEventPreferences, WeatherData } from '../types';
import { daysFromToday, toLocalDateKey } from './dateService';

export interface EventRecommendation {
  event: LocalEvent;
  score: number;
  reasons: string[];
  hasConflict: boolean;
  weather?: WeatherData;
}

export const eventMinutes = (time: string): number | null => {
  const match = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(time);
  if (!match) return null;
  return (Number(match[1]) % 12 + (match[3].toLowerCase() === 'pm' ? 12 : 0)) * 60 + Number(match[2] || 0);
};

const hasCalendarConflict = (event: LocalEvent, calendarEvents: CalendarEvent[]) => {
  const scheduled = calendarEvents.filter(item => item.date === event.date);
  if (scheduled.some(item => item.time.toLowerCase() === 'all day')) return true;

  const startsAt = eventMinutes(event.time);
  if (startsAt === null) return scheduled.length > 0;
  return scheduled.some(item => {
    const itemTime = eventMinutes(item.time);
    return itemTime !== null && Math.abs(itemTime - startsAt) < 180;
  });
};

export const scoreLocalEvent = (
  event: LocalEvent,
  calendarEvents: CalendarEvent[],
  weatherData: WeatherData[],
  preferences: LocalEventPreferences,
  now: Date = new Date(),
): EventRecommendation => {
  const reaction = preferences.reactions[event.id];
  const dayOffset = daysFromToday(event.date, now);
  const weather = dayOffset !== null && dayOffset >= 0 && dayOffset < weatherData.length ? weatherData[dayOffset] : undefined;
  const hasConflict = hasCalendarConflict(event, calendarEvents);
  const reasons: string[] = [];
  let score = 50;

  if (reaction === 'going') { score += 30; reasons.push('You’re going'); }
  if (reaction === 'interested') { score += 20; reasons.push('You’re interested'); }
  // Previously viewed events remain available, but fresh options are favored.
  if (!reaction && preferences.seen?.includes(event.id)) score -= 6;
  // Conflict status is the most actionable explanation, so keep it visible on
  // compact cards even when an event has many positive attributes.
  if (hasConflict) {
    score -= 35;
    reasons.push('Calendar conflict');
  } else {
    score += 12;
    reasons.push('Calendar is open');
  }
  if (event.categories.includes('family')) { score += 10; reasons.push('Family-friendly'); }
  if (event.categories.includes('festival')) { score += 7; reasons.push('Festival'); }
  if (event.price?.toLowerCase().includes('free')) { score += 10; reasons.push('Free'); }

  const eventDate = new Date(`${event.date}T12:00:00`);
  if (eventDate.getDay() === 0 || eventDate.getDay() === 6) score += 8;

  const startsAt = eventMinutes(event.time);
  if (startsAt !== null && startsAt >= 9 * 60 && startsAt <= 20 * 60) {
    score += 5;
    reasons.push('Family-friendly time');
  }

  if (weather) {
    if (event.isOutdoor && weather.condition === 'sunny') { score += 10; reasons.push(`Sunny · ${weather.temp}°`); }
    else if (event.isOutdoor && ['rainy', 'stormy'].includes(weather.condition)) { score -= 12; reasons.push(`${weather.condition === 'stormy' ? 'Stormy' : 'Rain likely'} · ${weather.temp}°`); }
    else reasons.push(`${weather.condition.replace('-', ' ')} · ${weather.temp}°`);
  }

  return { event, score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 3), hasConflict, weather };
};

export const formatEventDate = (dateKey: string): string => {
  const date = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(date.getTime()) ? dateKey : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const isThisWeekend = (dateKey: string, now: Date = new Date()) => {
  const offset = daysFromToday(dateKey, now);
  if (offset === null || offset < 0) return false;
  // On Sunday, the remaining portion of this weekend is today—not next week.
  if (now.getDay() === 0) return offset === 0;
  const thisSaturdayOffset = (6 - now.getDay() + 7) % 7;
  return offset >= thisSaturdayOffset && offset <= thisSaturdayOffset + 1;
};

export const isLaterToday = (event: LocalEvent, now: Date = new Date()) => {
  if (daysFromToday(event.date, now) !== 0) return false;
  const startsAt = eventMinutes(event.time);
  return startsAt === null || startsAt >= now.getHours() * 60 + now.getMinutes();
};

export const nearestWeekendDateKeys = (now: Date = new Date()) => {
  if (now.getDay() === 0) {
    return { saturday: '', sunday: toLocalDateKey(now) };
  }
  const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7));
  const sunday = new Date(saturday);
  sunday.setDate(sunday.getDate() + 1);
  return { saturday: toLocalDateKey(saturday), sunday: toLocalDateKey(sunday) };
};
