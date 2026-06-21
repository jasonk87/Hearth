import React, { useState, useEffect } from 'react';
import { getLocalEvents } from '../services/eventService';
import type { LocalEvent } from '../types';
import { Loader } from './Loader';
import { CalendarPlusIcon, MapPinIcon, ClockIcon, SearchIcon } from './icons';
import { useToast } from './Toast';
import { EventDetailModal } from './EventDetailModal';
import { MicInputButton } from './MicInputButton';

export const LocalEvents: React.FC<{
  onAddCalendarEvent: (title: string, date: string, time: string) => void;
}> = ({ onAddCalendarEvent }) => {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null);
  
  // Location States
  const [location, setLocation] = useState<string>(() => localStorage.getItem('hearth_user_location') || '');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState('');
  
  const { showToast } = useToast();

  const loadEventsForLocation = async (locString: string) => {
      setLoading(true);
      try {
          const fetchedEvents = await getLocalEvents(locString);
          setEvents(fetchedEvents);
      } catch (e) {
          console.error(e);
      }
      setLoading(false);
  };

  useEffect(() => {
    const initLocation = async () => {
      if (location) {
          // If we have a saved location, use it immediately
          loadEventsForLocation(location);
      } else {
          // Otherwise, try to guess via IP
          setLoading(true);
          try {
              const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
              const ipData = await ipRes.json();
              if (ipData.city && ipData.region) {
                  const locString = `${ipData.city}, ${ipData.region}`;
                  setLocation(locString);
                  localStorage.setItem('hearth_user_location', locString);
                  loadEventsForLocation(locString);
              } else {
                  throw new Error("Invalid IP geo data");
              }
          } catch (e) {
              console.warn("GeoJS failed. Waiting for user input.");
              setLoading(false);
              setIsEditingLocation(true); // Pop open the input!
          }
      }
    };

    initLocation();
  }, []); // Run only on mount

  const handleSaveLocation = () => {
      if (!tempLocation.trim()) return;
      setLocation(tempLocation);
      localStorage.setItem('hearth_user_location', tempLocation);
      setIsEditingLocation(false);
      loadEventsForLocation(tempLocation);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleSaveLocation();
      }
  };

  const handleAddEvent = (event: LocalEvent) => {
    onAddCalendarEvent(event.title, event.date, event.time);
    showToast(`Added ${event.title} to calendar!`, 'success');
  };

  if (loading) {
    return <Loader message="Scouring Google for local events..." />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden mb-8 shadow-xl shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-700 opacity-90 z-10" />
        <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover" alt="Concert Crowd" />
        <div className="relative z-20 p-8 sm:p-12 flex flex-col justify-center h-full text-white">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow-md">Discover Local Magic</h1>
            <p className="text-lg sm:text-xl max-w-2xl text-teal-50 drop-shadow mb-6">
                We've searched Google Events to find the best community gatherings, farmers markets, and festivals happening near you over the next month.
            </p>

            <div className="flex items-center">
                {isEditingLocation ? (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-lg w-full max-w-md animate-in fade-in slide-in-from-left-4">
                        <div className="pl-3 shrink-0">
                            <SearchIcon className="w-5 h-5 text-teal-100" />
                        </div>
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="Enter a city (e.g. Nashville, TN)" 
                            className="bg-transparent border-none outline-none text-white placeholder:text-teal-100/70 w-full font-medium text-lg py-1 px-2"
                            value={tempLocation}
                            onChange={(e) => setTempLocation(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <MicInputButton 
                            onTranscription={(text) => {
                                const cleanText = text.replace(/[.,!?]+$/, '').trim();
                                setTempLocation(cleanText);
                                setLocation(cleanText);
                                localStorage.setItem('hearth_user_location', cleanText);
                                setIsEditingLocation(false);
                                loadEventsForLocation(cleanText);
                            }}
                            className="!bg-transparent hover:!bg-white/20 !text-white border-0 shadow-none"
                        />
                        <button 
                            onClick={handleSaveLocation}
                            className="bg-white text-teal-800 hover:bg-teal-50 font-bold px-4 py-1.5 rounded-xl transition-colors shadow-sm whitespace-nowrap shrink-0"
                        >
                            Search
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => {
                            setTempLocation(location);
                            setIsEditingLocation(true);
                        }}
                        className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-white/20 hover:border-white/40 transition-all shadow-md"
                    >
                        <MapPinIcon className="w-5 h-5 text-teal-200" />
                        <span className="font-semibold text-lg drop-shadow">{location || "Set your location"}</span>
                        <div className="bg-white/20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                            <SearchIcon className="w-4 h-4 text-white" />
                        </div>
                    </button>
                )}
            </div>
        </div>
      </div>

      {!location ? (
        <div className="text-center py-20 bg-white/50 rounded-2xl border border-slate-200">
            <p className="text-xl text-slate-500 font-medium">Please enter your location above to discover events.</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-2xl border border-slate-200">
            <p className="text-xl text-slate-500 font-medium">No local events found for the upcoming weeks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event) => (
            <div 
                key={event.id} 
                onClick={() => setSelectedEvent(event)}
                className="group cursor-pointer relative bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full transform hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10" />
                  {event.imageUrl && (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" />
                  )}
              </div>
              <div className="p-5 flex flex-col flex-grow relative bg-gradient-to-b from-white/90 to-white">
                <h3 className="text-xl font-bold mb-3 text-slate-800 line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors" title={event.title}>{event.title}</h3>
                
                <div className="space-y-2 mb-2 flex-grow">
                    <div className="flex items-start gap-2 text-slate-600 text-sm">
                        <ClockIcon className="w-4 h-4 mt-0.5 shrink-0 text-teal-500" />
                        <p className="font-medium line-clamp-2">{event.date} • {event.time}</p>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600 text-sm">
                        <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0 text-teal-500" />
                        <p className="line-clamp-2">{event.location}</p>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEvent && (
          <EventDetailModal 
              event={selectedEvent} 
              onClose={() => setSelectedEvent(null)} 
              onAddEvent={handleAddEvent} 
          />
      )}
    </div>
  );
};
