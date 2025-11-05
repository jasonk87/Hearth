
import React from 'react';
import type { WeatherData } from '../types';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, CloudSunIcon } from './icons';

const SmallWeatherIcon: React.FC<{ condition: WeatherData['condition']; className?: string }> = ({ condition, className }) => {
  const iconProps = { className: `w-6 h-6 ${className}` };
  switch (condition) {
    case 'sunny': return <SunIcon {...iconProps} style={{ color: '#FBBF24' }} />;
    case 'cloudy': return <CloudIcon {...iconProps} style={{ color: '#9CA3AF' }} />;
    case 'rainy': return <CloudRainIcon {...iconProps} style={{ color: '#60A5FA' }} />;
    case 'stormy': return <CloudLightningIcon {...iconProps} style={{ color: '#A78BFA' }} />;
    case 'partly-cloudy': return <CloudSunIcon {...iconProps} style={{ color: '#FBBF24' }} />;
    default: return null;
  }
};

interface HourlyWeatherViewProps {
    hourlyData: NonNullable<WeatherData['hourly']>;
}

export const HourlyWeatherView: React.FC<HourlyWeatherViewProps> = ({ hourlyData }) => {
    return (
        <div className="w-full mt-4 border-t border-gray-600 pt-4 max-h-48 overflow-y-auto">
            <div className="space-y-3">
                {hourlyData.map((hour, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{hour.time}</span>
                        <SmallWeatherIcon condition={hour.condition} />
                        <span className="font-semibold text-gray-200">{hour.temp}°</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
