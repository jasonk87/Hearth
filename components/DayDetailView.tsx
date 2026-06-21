import React, { useState } from 'react';
import type { CalendarEvent, WeatherData } from '../types';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, CloudSunIcon, XIcon, ChefHatIcon } from './icons';
import { HourlyWeatherView } from './HourlyWeatherView';

const WeatherIcon: React.FC<{ condition: WeatherData['condition']; className?: string }> = ({ condition, className }) => {
  const iconProps = { className: `w-16 h-16 ${className}` };
  switch (condition) {
    case 'sunny': return <SunIcon {...iconProps} style={{ color: '#FBBF24' }} />;
    case 'cloudy': return <CloudIcon {...iconProps} style={{ color: '#9CA3AF' }} />;
    case 'rainy': return <CloudRainIcon {...iconProps} style={{ color: '#60A5FA' }} />;
    case 'stormy': return <CloudLightningIcon {...iconProps} style={{ color: '#A78BFA' }} />;
    case 'partly-cloudy': return <CloudSunIcon {...iconProps} style={{ color: '#FBBF24' }} />;
    default: return null;
  }
};

interface DayDetailViewProps {
  day: Date;
  events: CalendarEvent[];
  weather: WeatherData | null;
  onClose: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
  dinner?: import('../types').Recipe;
}

export const DayDetailView: React.FC<DayDetailViewProps> = ({ day, events, weather, onClose, onSelectEvent, dinner }) => {
  const [showHourly, setShowHourly] = useState(false);
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 border border-slate-300 rounded-2xl shadow-2xl w-full max-w-2xl m-4 animate-slide-up-fast flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200/80">
          <div>
            <h3 className="text-2xl font-bold text-teal-600">
              {day.toLocaleDateString('en-US', { weekday: 'long' })}
            </h3>
            <p className="text-lg text-slate-500">
              {day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <XIcon className="w-6 h-6 text-slate-500" />
          </button>
        </header>

        <div className="flex flex-col sm:flex-row p-6 gap-6 overflow-y-auto">
          {/* Weather Section */}
          <div className="flex-shrink-0 sm:w-1/3 flex flex-col items-center p-4 bg-slate-100/80 rounded-lg">
            {weather ? (
              <>
                <div className="flex flex-col items-center">
                    <WeatherIcon condition={weather.condition} />
                    <p className="text-5xl font-bold mt-2 text-slate-800">{weather.temp}°</p>
                    <p className="text-slate-600 capitalize">{weather.condition.replace('-', ' ')}</p>
                </div>
                {weather.hourly && weather.hourly.length > 0 && (
                  <button 
                    onClick={() => setShowHourly(!showHourly)} 
                    className="mt-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2 px-4 rounded-md text-sm w-full transition-colors"
                  >
                    {showHourly ? 'Hide Hourly' : 'View Hourly Forecast'}
                  </button>
                )}
                {showHourly && weather.hourly && <HourlyWeatherView hourlyData={weather.hourly} />}
              </>
            ) : (
              <p className="text-slate-500 text-center">No weather forecast available for this day.</p>
            )}
          </div>

          {/* Events & Dinner Section */}
          <div className="flex-grow">
            <h4 className="text-xl font-semibold mb-3 text-slate-800">Events</h4>
            <div className="space-y-3">
              {events.length > 0 ? (
                events.map((event) => (
                  <button 
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className={`w-full text-left p-3 rounded-lg text-white transition-transform hover:scale-105 shadow-sm border-l-4 border-white/40 ${!event.color.startsWith('#') ? event.color : ''}`}
                    style={event.color.startsWith('#') ? { backgroundColor: event.color } : {}}
                  >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg">{event.title}</p>
                            <p className="text-sm opacity-90 font-medium">{event.time}</p>
                        </div>
                        {event.calendarName && (
                            <span className="text-xs bg-black/20 px-2 py-1 rounded-full font-medium backdrop-blur-sm">
                                {event.calendarName}
                            </span>
                        )}
                    </div>
                    {event.participants && event.participants.length > 0 && (
                        <p className="text-xs opacity-90 mt-2 truncate font-medium bg-black/10 p-1 rounded">
                            👥 {event.participants.join(', ')}
                        </p>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-slate-500 italic">No events scheduled for this day.</p>
              )}
            </div>
             {dinner && (
              <div className="mt-6">
                <h4 className="text-xl font-semibold mb-3 text-slate-800 flex items-center gap-2">
                    <ChefHatIcon className="w-5 h-5" /> Dinner
                </h4>
                <div className="p-3 rounded-lg bg-teal-50 text-teal-800">
                  <p className="font-bold">{dinner.recipeName}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
       <style>{`
        @keyframes slide-up-fast {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up-fast {
          animation: slide-up-fast 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};