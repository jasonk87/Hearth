import type { LocalEvent, LocalEventCategory } from '../types';
import { normalizeEventDate } from './dateService';

const USE_FAKE_DATA = import.meta.env.VITE_USE_FAKE_DATA === 'true';
const CACHE_KEY = 'hearth-local-event-discovery-v2';
const CACHE_DURATION_MS = 15 * 60 * 1000;

const categoriesFor = (title: string, description: string): LocalEventCategory[] => {
  const text = `${title} ${description}`.toLowerCase();
  const categories: LocalEventCategory[] = [];
  if (/family|kid|child|children|youth|all ages/.test(text)) categories.push('family');
  if (/music|concert|jazz|band|orchestra|dj|sing/.test(text)) categories.push('music');
  if (/sport|game|baseball|football|soccer|basketball|race|rodeo/.test(text)) categories.push('sports');
  if (/festival|fair|carnival|highland|celebration/.test(text)) categories.push('festival');
  if (/food|dining|cook|tasting|brew|wine|market/.test(text)) categories.push('food');
  if (/outdoor|park|trail|hike|farm|market|fair|festival/.test(text)) categories.push('outdoors');
  return categories.length ? categories : ['other'];
};

const extractTime = (value: string | undefined) => {
  const match = /(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i.exec(value || '');
  return match ? match[1].toUpperCase() : value || 'Check details';
};

const fallbackEvents = (): LocalEvent[] => [
  {
    id: 'farmers-market',
    title: 'Farmers Market',
    date: normalizeEventDate('Upcoming Saturday')!,
    time: '9:00 AM',
    location: 'Central Square',
    venue: 'Central Square',
    description: 'Fresh produce, local crafts, and live music.',
    price: 'Free',
    categories: ['family', 'food', 'outdoors'],
    isOutdoor: true,
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'outdoor-movie-goonies',
    title: 'Outdoor Movie Night: The Goonies',
    date: normalizeEventDate('Upcoming Friday')!,
    time: '8:30 PM',
    location: 'City Park',
    venue: 'City Park',
    description: 'Bring a blanket and enjoy a classic movie under the stars.',
    price: 'Free',
    categories: ['family', 'outdoors'],
    isOutdoor: true,
    imageUrl: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=2079&auto=format&fit=crop',
  },
  {
    id: 'live-jazz-blue-note',
    title: 'Live Jazz at The Blue Note',
    date: normalizeEventDate('Upcoming Sunday')!,
    time: '7:00 PM',
    location: 'The Blue Note Club',
    venue: 'The Blue Note Club',
    description: 'An evening of smooth jazz with the Miles Davis Quintet tribute band.',
    categories: ['music'],
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2000&auto=format&fit=crop',
  },
];

const fingerprint = (title: string, date: string, location: string) =>
  `${title}|${date}|${location}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const cachedEvents = (location: string, radius: number): LocalEvent[] | null => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached?.location === location && cached.radius === radius && Date.now() - cached.timestamp < CACHE_DURATION_MS) return cached.events;
  } catch {
    // A cache miss is safe and simply fetches a fresh result.
  }
  return null;
};

const storeEvents = (location: string, radius: number, events: LocalEvent[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ location, radius, timestamp: Date.now(), events }));
  } catch {
    // Discovery works even when browser storage is unavailable.
  }
};

export const getLocalEvents = async (locationQuery: string, radius = 50): Promise<LocalEvent[]> => {
  if (USE_FAKE_DATA) return fallbackEvents();
  const cached = cachedEvents(locationQuery, radius);
  if (cached) return cached;

  try {
    const area = `within ${radius} miles of ${locationQuery}`;
    const searchQueries = [
      `events in ${locationQuery}`,
      `family events ${area}`,
      `festivals ${area}`,
      `live music ${area}`,
      `sports events ${area}`,
      `free events ${area}`,
      `kids events ${area}`,
      `things to do this weekend ${area}`,
    ];
    const resultsArray = await Promise.all(searchQueries.map(async query => {
      const response = await fetch(`/api/serp/search.json?engine=google_events&q=${encodeURIComponent(query)}&htichips=date:next_month`);
      return response.ok ? (await response.json()).events_results || [] : [];
    }));

    const deduplicated = new Map<string, any>();
    resultsArray.flat().forEach((event: any) => {
      const date = normalizeEventDate(event.date?.start_date || '');
      const location = event.address?.join(', ') || event.venue?.name || locationQuery;
      if (date) deduplicated.set(fingerprint(event.title || 'event', date, location), event);
    });

    const events = Array.from(deduplicated.values()).map((event: any) => {
      const date = normalizeEventDate(event.date?.start_date || '')!;
      const venue = event.venue?.name;
      const location = event.address?.join(', ') || venue || locationQuery;
      const description = event.description || '';
      const ticket = event.ticket_info?.[0] || event.tickets?.[0];
      const categories = categoriesFor(event.title || '', description);
      return {
        id: fingerprint(event.title || 'event', date, location),
        title: event.title || 'Local event',
        date,
        time: extractTime(event.date?.when),
        location,
        venue,
        description,
        imageUrl: event.image || event.thumbnail,
        sourceUrl: event.link || ticket?.link || ticket?.website,
        ticketUrl: ticket?.link || ticket?.website,
        price: ticket?.price || ticket?.price_range || event.price,
        categories,
        isOutdoor: categories.includes('outdoors'),
      } satisfies LocalEvent;
    }).sort((left, right) => left.date.localeCompare(right.date) || left.time.localeCompare(right.time));

    if (events.length) {
      storeEvents(locationQuery, radius, events);
      return events;
    }
  } catch (error) {
    console.error('Failed to fetch local events via SerpApi:', error);
  }
  return fallbackEvents();
};
