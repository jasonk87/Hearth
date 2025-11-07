
import { LocalEvent } from '../types';

const API_KEY = import.meta.env.VITE_HASDATA_API_KEY;
const USE_FAKE_DATA = import.meta.env.VITE_USE_FAKE_DATA === 'true';

const fakeEvents: LocalEvent[] = [
  {
    id: '1',
    title: 'Farmers Market',
    date: '2024-07-27',
    time: '9:00 AM',
    location: 'Central Square',
    description: 'Fresh produce, local crafts, and live music.',
    imageUrl: 'https://example.com/farmers-market.jpg',
  },
  {
    id: '2',
    title: 'Outdoor Movie Night: The Goonies',
    date: '2024-07-27',
    time: '8:30 PM',
    location: 'City Park',
    description: 'Bring a blanket and enjoy a classic movie under the stars.',
    imageUrl: 'https://example.com/movie-night.jpg',
  },
  {
    id: '3',
    title: 'Live Jazz at The Blue Note',
    date: '2024-07-28',
    time: '7:00 PM',
    location: 'The Blue Note Club',
    description: 'An evening of smooth jazz with the Miles Davis Quintet tribute band.',
    imageUrl: 'https://example.com/jazz-club.jpg',
  },
];

export const getLocalEvents = async (latitude: number, longitude: number): Promise<LocalEvent[]> => {
  if (USE_FAKE_DATA) {
    console.log('Using fake local event data');
    return Promise.resolve(fakeEvents);
  }

  if (!API_KEY) {
    console.error("VITE_HASDATA_API_KEY is not set. Please add it to your .env file.");
    return [];
  }

  const url = `https://api.hasdata.com/google-events/v1/events?latitude=${latitude}&longitude=${longitude}&radius=50`;

  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();

    // The actual data structure will depend on the API response.
    // This is a placeholder for the transformation logic.
    const events: LocalEvent[] = data.map((event: any) => ({
      id: event.id,
      title: event.title,
      date: new Date(event.date.start_date).toISOString().split('T')[0],
      time: event.date.when,
      location: event.address.join(', '),
      description: event.description,
      imageUrl: event.image,
    }));

    return events;
  } catch (error) {
    console.error('Failed to fetch local events:', error);
    return [];
  }
};
