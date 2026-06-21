import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CalendarEvent, WeatherData, CalendarSource, Recipe } from '../types';
import { playSound } from '../services/soundService';
import { getWeatherForecast } from '../services/weatherService'; // We will create this

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

const DINNER_PLAN_CACHE_KEY = 'hearth_dinner_plan_cache';
const LOCAL_EVENTS_CACHE_KEY = 'hearth_local_events_cache';

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
      try {
          const cached = localStorage.getItem(LOCAL_EVENTS_CACHE_KEY);
          if (cached) return JSON.parse(cached);
      } catch (e) {
          console.error("Failed to load local events cache", e);
      }
      return [];
  });
  
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  
  const [dinnerPlan, setDinnerPlan] = useState<Record<string, Recipe>>(() => {
      try {
          const cached = localStorage.getItem(DINNER_PLAN_CACHE_KEY);
          if (cached) return JSON.parse(cached);
      } catch (e) {
          console.error("Failed to load dinner plan cache", e);
      }
      return {};
  });

  useEffect(() => {
      const localEvents = events.filter(e => e.source === 'family');
      localStorage.setItem(LOCAL_EVENTS_CACHE_KEY, JSON.stringify(localEvents));
  }, [events]);

  useEffect(() => {
      localStorage.setItem(DINNER_PLAN_CACHE_KEY, JSON.stringify(dinnerPlan));
  }, [dinnerPlan]);

  useEffect(() => {
    const fetchWeather = async () => {
        try {
            const forecast = await getWeatherForecast();
            setWeatherData(forecast);
        } catch (error) {
            console.error("Failed to fetch weather data:", error);
        }
    };
    fetchWeather();
  }, []);

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
    setDinnerPlan(prev => {
        const updated = { ...prev };
        if (dinner) {
            updated[dateKey] = dinner;
        } else {
            delete updated[dateKey];
        }
        return updated;
    });
  }, []);

  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
        const dayKey = event.date;
        if (!acc[dayKey]) acc[dayKey] = [];
        acc[dayKey].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events]);

  const eventsBySourceAndDate = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!acc[event.source]) acc[event.source] = {};
      const dayKey = event.date;
      if (!acc[event.source][dayKey]) acc[event.source][dayKey] = [];
      acc[event.source][dayKey].push(event);
      return acc;
    }, { family: {}, google: {} } as Record<CalendarSource, Record<string, CalendarEvent[]>>);
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
