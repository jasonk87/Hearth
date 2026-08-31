import { WeatherData } from '../types';
import { USE_FAKE_DATA } from './geminiService';

const mockWeather = (): WeatherData[] => Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    temp: 72,
    condition: 'partly-cloudy',
    ...(index === 0 ? { hourly: [{ time: '3 PM', temp: 72, condition: 'partly-cloudy' as const }] } : {}),
  };
});

/** Retrieves a real forecast for the saved household location through the server. */
export async function getWeatherForecast(location: string): Promise<WeatherData[]> {
  if (USE_FAKE_DATA) return mockWeather();
  if (!location.trim()) return [];
  const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
  if (!response.ok) throw new Error(`Weather request failed (${response.status})`);
  return response.json() as Promise<WeatherData[]>;
}
