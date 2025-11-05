

import React, { useState, useMemo } from 'react';
import type { CalendarEvent, WeatherData, CalendarSource, User } from '../types';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, CloudSunIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

const WeatherIcon: React.FC<{ condition: WeatherData['condition']; className?: string }> = ({ condition, className }) => {
  const iconProps = { className: `w-5 h-5 ${className}` };
  switch (condition) {
    case 'sunny': return <SunIcon {...iconProps} style={{ color: '#FBBF24' }} />;
    case 'cloudy': return <CloudIcon {...iconProps} style={{ color: '#9CA3AF' }} />;
    case 'rainy': return <CloudRainIcon {...iconProps} style={{ color: '#60A5FA' }} />;
    case 'stormy': return <CloudLightningIcon {...iconProps} style={{ color: '#A78BFA' }} />;
    case 'partly-cloudy': return <CloudSunIcon {...iconProps} style={{ color: '#FBBF24' }} />;
    default: return null;
  }
};

interface CalendarAppProps {
    eventsBySource: Record<string, CalendarEvent[]>; // Actually eventsByDate
    weatherData: WeatherData[];
    onSelectDay: (day: Date) => void;
    onSelectEvent: (event: CalendarEvent) => void;
}

export const CalendarApp: React.FC<CalendarAppProps> = ({ eventsBySource, weatherData, onSelectDay, onSelectEvent }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // In this view, we'll just show the events passed in (already filtered by App.tsx)
    const visibleEvents = eventsBySource;

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDay = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days = [];
    for (let i = 0; i < startingDay; i++) { days.push(null); }
    for (let i = 1; i <= totalDays; i++) { days.push(new Date(year, month, i)); }

    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];

    return (
        <div className="flex flex-col h-full relative text-slate-700">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><ChevronLeftIcon className="w-6 h-6" /></button>
                    <h2 className="text-2xl font-bold text-slate-800 text-center w-48">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><ChevronRightIcon className="w-6 h-6" /></button>
                </div>
            </header>
            
            <div className="grid grid-cols-7 text-center font-semibold text-teal-700 border-b border-slate-300 pb-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-grow">
                {days.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} className="rounded-lg bg-slate-100/40"></div>;
                    
                    const dayKey = day.toISOString().split('T')[0];
                    const isToday = dayKey === todayKey;
                    const dayEvents = visibleEvents[dayKey] || [];
                    
                    const dayDiff = Math.floor((new Date(day).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (1000 * 3600 * 24));
                    const weather = (dayDiff >= 0 && dayDiff < 7) ? weatherData[dayDiff] : null;

                    return (
                        <div 
                            key={dayKey} 
                            onClick={() => onSelectDay(day)}
                            className={`rounded-lg p-2 flex flex-col bg-slate-50/50 cursor-pointer transition-all hover:bg-white/70 ${isToday ? 'border-2 border-teal-500' : 'border border-transparent'}`}
                        >
                            <div className="flex justify-between items-center">
                                <p className={`font-bold ${isToday ? 'text-teal-600' : 'text-slate-800'}`}>{day.getDate()}</p>
                                {weather && (
                                    <div className="flex items-center space-x-1 text-xs">
                                        <WeatherIcon condition={weather.condition} />
                                        <span>{weather.temp}°</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-1 space-y-1 flex-grow overflow-y-auto text-xs pr-1">
                                {dayEvents.map((event) => {
                                    return (
                                        <div 
                                            key={event.id} 
                                            onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                                            className={`p-1 rounded text-white truncate ${event.color} border-l-2 border-green-500`}
                                            title={`${event.title} (Family)`}
                                        >
                                            {event.title}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
