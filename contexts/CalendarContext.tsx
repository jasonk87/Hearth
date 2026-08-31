import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CalendarEvent, WeatherData, CalendarSource, Recipe } from '../types';
import { playSound } from '../services/soundService';
import { getWeatherForecast } from '../services/weatherService'; // We will create this
import { usePersistentState } from './PersistentStateContext';

interface CalendarContextType {
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  weatherData: WeatherData[];
  dinnerPlan: Record<string, Recipe>;
  addCalendarEvent: (title: string, date: string, time: string) => void;
  editCalendarEvent: (eventToEdit: CalendarEvent) => void;
  deleteCalendarEvent: (eventId: CalendarEvent['id']) => void;
  setDinnerForDay: (dateKey: string, dinner: Recipe | null) => void;
  eventsByDate: Record<string, CalendarEvent[]>;
  eventsBySourceAndDate: Record<CalendarSource, Record<string, CalendarEvent[]>>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const calendarTimeToMinutes = (time: string): number => {
  if (time.toLowerCase() === 'all day') return -1;

  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i.exec(time.trim());
  if (!match) return Number.MAX_SAFE_INTEGER;

  const hours = Number(match[1]) % 12 + (match[3].toLowerCase() === 'pm' ? 12 : 0);
  return hours * 60 + Number(match[2] || 0);
};

const compareCalendarEvents = (left: CalendarEvent, right: CalendarEvent): number => {
  const timeDifference = calendarTimeToMinutes(left.time) - calendarTimeToMinutes(right.time);
  if (timeDifference !== 0) return timeDifference;

  const titleDifference = left.title.localeCompare(right.title);
  if (titleDifference !== 0) return titleDifference;

  return String(left.id).localeCompare(String(right.id));
};

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, setField } = usePersistentState();
  const [events, setEvents] = useState<CalendarEvent[]>(state.familyEvents);
  
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  
  const dinnerPlan = state.dinnerPlan;

  useEffect(() => {
      const localEvents = events.filter(e => e.source === 'family');
      setField('familyEvents', localEvents);
  }, [events, setField]);

  useEffect(() => {
    const fetchWeather = async () => {
        try {
            const forecast = await getWeatherForecast(state.location);
            setWeatherData(forecast);
        } catch (error) {
            console.error("Failed to fetch weather data:", error);
        }
    };
    fetchWeather();
  }, [state.location]);

  const addCalendarEvent = useCallback((title: string, date: string, time: string) => {
    const newEvent: CalendarEvent = {
      id: Date.now(),
      time,
      title,
      color: 'bg-purple-500',
      source: 'family',
      date,
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);
  
  const editCalendarEvent = useCallback((eventToEdit: CalendarEvent) => {
      setEvents(prev => prev.map(e => e.id === eventToEdit.id ? eventToEdit : e));
  }, []);
  
  const deleteCalendarEvent = useCallback((eventId: CalendarEvent['id']) => {
      playSound('delete');
      setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  const setDinnerForDay = useCallback((dateKey: string, dinner: Recipe | null) => {
    setField('dinnerPlan', prev => {
        const updated = { ...prev };
        if (dinner) {
            updated[dateKey] = dinner;
        } else {
            delete updated[dateKey];
        }
        return updated;
    });
  }, [setField]);

  const eventsByDate = useMemo(() => {
    const groupedEvents = events.reduce((acc, event) => {
        const dayKey = event.date;
        if (!acc[dayKey]) acc[dayKey] = [];
        acc[dayKey].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);

    Object.values(groupedEvents).forEach(dayEvents => (dayEvents as CalendarEvent[]).sort(compareCalendarEvents));
    return groupedEvents;
  }, [events]);

  const eventsBySourceAndDate = useMemo(() => {
    const groupedEvents = events.reduce((acc, event) => {
      if (!acc[event.source]) acc[event.source] = {};
      const dayKey = event.date;
      if (!acc[event.source][dayKey]) acc[event.source][dayKey] = [];
      acc[event.source][dayKey].push(event);
      return acc;
    }, { family: {}, google: {} } as Record<CalendarSource, Record<string, CalendarEvent[]>>);

    Object.values(groupedEvents).forEach(sourceEvents => {
      Object.values(sourceEvents).forEach(dayEvents => (dayEvents as CalendarEvent[]).sort(compareCalendarEvents));
    });
    return groupedEvents;
  }, [events]);

  return (
    <CalendarContext.Provider value={{
      events, setEvents, weatherData, dinnerPlan,
      addCalendarEvent, editCalendarEvent, deleteCalendarEvent, setDinnerForDay,
      eventsByDate, eventsBySourceAndDate
    }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
