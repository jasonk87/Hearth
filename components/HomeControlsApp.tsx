import React from 'react';
import type { SmartHomeState, Light, Thermostat } from '../types';
import { LightbulbIcon, LightbulbOffIcon, ThermometerIcon, SunriseIcon, FilmIcon, MoonIcon, DoorClosedIcon } from './icons';

// --- Reusable Components ---
const ToggleSwitch: React.FC<{ on: boolean; onChange: (on: boolean) => void }> = ({ on, onChange }) => (
  <button
    onClick={() => onChange(!on)}
    className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ${on ? 'bg-teal-500' : 'bg-slate-600'}`}
  >
    <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const SceneButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void }> = ({ label, icon, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-700/50 rounded-lg text-center transition-all duration-300 hover:bg-slate-700 hover:border-teal-500 border border-transparent"
    >
        {icon}
        <span className="font-semibold text-slate-300">{label}</span>
    </button>
);

// --- App Sections ---
interface LightControlsProps {
    lights: Record<string, Light>;
    onLightChange: (id: string, newValues: Partial<Light>) => void;
}
// FIX: Switched from Object.entries to Object.keys to ensure proper type inference for the `light` object.
const LightControls: React.FC<LightControlsProps> = ({ lights, onLightChange }) => (
    <div>
        <h3 className="text-xl font-semibold text-slate-300 mb-3">Lights</h3>
        <div className="space-y-3">
            {Object.keys(lights).map((id) => {
                const light = lights[id];
                return (
                    <div key={id} className="bg-slate-700/50 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {light.on ? <LightbulbIcon className="w-6 h-6 text-yellow-300" /> : <LightbulbOffIcon className="w-6 h-6 text-slate-400" />}
                            <span className="font-bold text-lg text-slate-200">{light.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={light.brightness}
                                onChange={(e) => onLightChange(id, { brightness: parseInt(e.target.value) })}
                                className="w-32 accent-teal-500"
                                disabled={!light.on}
                            />
                            <span className="text-slate-400 w-8 text-right">{light.brightness}%</span>
                            <ToggleSwitch on={light.on} onChange={(on) => onLightChange(id, { on })} />
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

interface ThermostatControlsProps {
    thermostat: Thermostat;
    onThermostatChange: (newValues: Partial<Thermostat>) => void;
}
const ThermostatControls: React.FC<ThermostatControlsProps> = ({ thermostat, onThermostatChange }) => (
    <div>
        <h3 className="text-xl font-semibold text-slate-300 mb-3">Thermostat</h3>
        <div className="bg-slate-700/50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <ThermometerIcon className="w-8 h-8 text-blue-300" />
                <div>
                    <p className="text-slate-400">Current</p>
                    <p className="font-bold text-3xl text-slate-200">{thermostat.currentTemp}°</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="font-semibold">Set to:</span>
                <button onClick={() => onThermostatChange({ targetTemp: thermostat.targetTemp - 1 })} className="w-10 h-10 rounded-full bg-slate-600 text-2xl">-</button>
                <span className="font-bold text-3xl text-teal-300 w-16 text-center">{thermostat.targetTemp}°</span>
                <button onClick={() => onThermostatChange({ targetTemp: thermostat.targetTemp + 1 })} className="w-10 h-10 rounded-full bg-slate-600 text-2xl">+</button>
            </div>
        </div>
    </div>
);

interface SceneControlsProps {
    onActivateScene: (sceneName: 'good morning' | 'movie night' | 'goodnight' | 'im leaving') => void;
}
const SceneControls: React.FC<SceneControlsProps> = ({ onActivateScene }) => (
    <div>
        <h3 className="text-xl font-semibold text-slate-300 mb-3">Scenes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SceneButton label="Good Morning" icon={<SunriseIcon className="w-8 h-8 text-yellow-400"/>} onClick={() => onActivateScene('good morning')} />
            <SceneButton label="Movie Night" icon={<FilmIcon className="w-8 h-8 text-purple-400"/>} onClick={() => onActivateScene('movie night')} />
            <SceneButton label="Goodnight" icon={<MoonIcon className="w-8 h-8 text-blue-400"/>} onClick={() => onActivateScene('goodnight')} />
            <SceneButton label="I'm Leaving" icon={<DoorClosedIcon className="w-8 h-8 text-red-400"/>} onClick={() => onActivateScene('im leaving')} />
        </div>
    </div>
);


// --- Main Component ---
interface HomeControlsAppProps {
  state: SmartHomeState;
  onLightChange: (id: string, newValues: Partial<Light>) => void;
  onThermostatChange: (newValues: Partial<Thermostat>) => void;
  onActivateScene: (sceneName: 'good morning' | 'movie night' | 'goodnight' | 'im leaving') => void;
}

export const HomeControlsApp: React.FC<HomeControlsAppProps> = ({ state, onLightChange, onThermostatChange, onActivateScene }) => {
  return (
    <div className="flex flex-col h-full space-y-6">
        <LightControls lights={state.lights} onLightChange={onLightChange} />
        <ThermostatControls thermostat={state.thermostat} onThermostatChange={onThermostatChange} />
        <SceneControls onActivateScene={onActivateScene} />
    </div>
  );
};