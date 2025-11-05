import React from 'react';
import { Widget } from './Widget';
import type { SmartHomeState, Light, Thermostat } from '../types';
import { HomeIcon, LightbulbIcon, LightbulbOffIcon, ThermometerIcon, SunriseIcon, FilmIcon } from './icons';

interface HomeControlsWidgetProps {
    state: SmartHomeState;
    onLightChange: (id: string, newValues: Partial<Light>) => void;
    onThermostatChange: (newValues: Partial<Thermostat>) => void;
    onActivateScene: (sceneName: 'good morning' | 'movie night') => void;
    onClick?: () => void;
    className?: string;
}

const ToggleSwitch: React.FC<{ on: boolean; onChange: (on: boolean) => void }> = ({ on, onChange }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onChange(!on); }}
    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${on ? 'bg-teal-600' : 'bg-stone-400'}`}
  >
    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

export const HomeControlsWidget: React.FC<HomeControlsWidgetProps> = ({ state, onLightChange, onActivateScene, onClick, className }) => {
    const mainLightId = 'living-room';
    const mainLight = state.lights[mainLightId];

    return (
        <Widget title="Home Controls" onClick={onClick} className={className} titleAction={<HomeIcon className="text-teal-700" />}>
            <div className="space-y-4 h-full flex flex-col justify-between">
                {mainLight && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {mainLight.on ? <LightbulbIcon className="w-6 h-6 text-yellow-500"/> : <LightbulbOffIcon className="w-6 h-6 text-stone-500" />}
                            <span className="font-semibold text-lg">{mainLight.name}</span>
                        </div>
                        <ToggleSwitch on={mainLight.on} onChange={(on) => onLightChange(mainLightId, { on })} />
                    </div>
                )}
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <ThermometerIcon className="w-6 h-6 text-blue-500" />
                        <span className="font-semibold text-lg">Thermostat</span>
                    </div>
                    <span className="font-bold text-xl text-stone-800">{state.thermostat.targetTemp}°</span>
                </div>
                 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                    <button onClick={(e) => {e.stopPropagation(); onActivateScene('good morning');}} className="flex items-center justify-center gap-2 p-2 bg-stone-100/70 hover:bg-stone-200/70 rounded-lg transition-colors">
                        <SunriseIcon className="w-5 h-5 text-orange-500" />
                        <span className="font-semibold text-sm">Morning</span>
                    </button>
                    <button onClick={(e) => {e.stopPropagation(); onActivateScene('movie night');}} className="flex items-center justify-center gap-2 p-2 bg-stone-100/70 hover:bg-stone-200/70 rounded-lg transition-colors">
                        <FilmIcon className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-sm">Movie</span>
                    </button>
                </div>
            </div>
        </Widget>
    );
};
