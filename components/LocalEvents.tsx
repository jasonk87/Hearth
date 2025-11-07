
import React, { useState, useEffect } from 'react';
import { getLocalEvents } from '../services/eventService';
import type { LocalEvent } from '../types';
import { Loader } from './Loader';
import { CalendarPlusIcon } from './icons';

export const LocalEvents: React.FC<{
  onAddCalendarEvent: (title: string, date: string, time: string) => void;
}> = ({ onAddCalendarEvent }) => {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      // Using a mock location for now. In a real application, you would get the user's location.
      const fetchedEvents = await getLocalEvents(34.0522, -118.2437);
      setEvents(fetchedEvents);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <Loader message="Finding local events..." />;
  }

  const handleAddEvent = (event: LocalEvent) => {
    onAddCalendarEvent(event.title, event.date, event.time);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Local Events</h2>
      {events.length === 0 ? (
        <p className="text-center text-gray-500">No local events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
              {event.imageUrl && (
                <img src={event.imageUrl} alt={event.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-700">{event.title}</h3>
                <p className="text-sm text-gray-500 mb-1">{event.date} at {event.time}</p>
                <p className="text-sm text-gray-600 mb-3">{event.location}</p>
                <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                <button
                  onClick={() => handleAddEvent(event)}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <CalendarPlusIcon className="w-5 h-5" />
                  Add to Calendar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
