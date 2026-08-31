import { LocalEvent } from '../types';
import { normalizeEventDate } from './dateService';

const USE_FAKE_DATA = import.meta.env.VITE_USE_FAKE_DATA === 'true';

const fallbackEvents = (): LocalEvent[] => [
  {
    id: '1',
    title: 'Farmers Market',
    date: normalizeEventDate('Upcoming Saturday')!,
    time: '9:00 AM',
    location: 'Central Square',
    description: 'Fresh produce, local crafts, and live music.',
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Outdoor Movie Night: The Goonies',
    date: normalizeEventDate('Upcoming Friday')!,
    time: '8:30 PM',
    location: 'City Park',
    description: 'Bring a blanket and enjoy a classic movie under the stars.',
    imageUrl: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=2079&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Live Jazz at The Blue Note',
    date: normalizeEventDate('Upcoming Sunday')!,
    time: '7:00 PM',
    location: 'The Blue Note Club',
    description: 'An evening of smooth jazz with the Miles Davis Quintet tribute band.',
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2000&auto=format&fit=crop',
  },
];

export const getLocalEvents = async (locationQuery: string): Promise<LocalEvent[]> => {
  if (USE_FAKE_DATA) {
    console.log('Using fallback local event data');
    return Promise.resolve(fallbackEvents());
  }

  try {
    console.log(`HEARTH DEBUG: Fetching events for: ${locationQuery}`);
    
    const searchQueries = [`events in ${locationQuery}`];
    
    // 3. Fire all SerpApi requests in parallel via the Vite proxy
    const fetchPromises = searchQueries.map(async (queryStr) => {
        const query = encodeURIComponent(queryStr);
        const proxyUrl = `/api/serp/search.json?engine=google_events&q=${query}&htichips=date:next_month`;
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) return null;
            const data = await response.json();
            return data.events_results || [];
        } catch (e) {
            return [];
        }
    });

    const resultsArray = await Promise.all(fetchPromises);
    
    // 4. Flatten and completely deduplicate the regional events
    const allRawEvents: any[] = [];
    const seenIds = new Set<string>();
    
    for (const results of resultsArray) {
        if (!results) continue;
        for (const event of results) {
            // Create a unique fingerprint based on title and date to prevent overlaps
            const uniqueFingerprint = (event.title + (event.date?.start_date || '')).replace(/\s+/g, '');
            if (!seenIds.has(uniqueFingerprint)) {
                seenIds.add(uniqueFingerprint);
                allRawEvents.push(event);
            }
        }
    }
    
    if (allRawEvents.length === 0) {
        console.log("No events found from SerpApi. Falling back to default data.");
        return fallbackEvents();
    }

    const rawEvents = allRawEvents.map((event: any, index: number) => ({
      id: (event.title + index).replace(/\s+/g, ''),
      title: event.title,
      date: normalizeEventDate(event.date?.start_date || '') || '',
      time: event.date?.when || 'Check details',
      location: event.address?.join(', ') || event.venue?.name || locationQuery,
      description: event.description || '',
      imageUrl: event.image || event.thumbnail || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop',
      _rawDate: event.date?.start_date,
    }));

    // Sort chronologically
    rawEvents.sort((a: any, b: any) => {
        if (!a._rawDate) return 1;
        if (!b._rawDate) return -1;
        const dateA = normalizeEventDate(a._rawDate || '');
        const dateB = normalizeEventDate(b._rawDate || '');
        
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return dateA.localeCompare(dateB);
    });

    return rawEvents.map((e: any) => {
        delete e._rawDate;
        return e.date ? e as LocalEvent : null;
    }).filter((event): event is LocalEvent => event !== null);
  } catch (error) {
    console.error('Failed to fetch local events via SerpApi:', error);
    return fallbackEvents();
  }
};
