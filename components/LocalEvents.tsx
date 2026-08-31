import React, { useEffect, useMemo, useState } from 'react';
import { getLocalEventDiscovery } from '../services/eventService';
import { daysFromToday } from '../services/dateService';
import { formatEventDate, isLaterToday, isThisWeekend, nearestWeekendDateKeys, scoreLocalEvent, type EventRecommendation } from '../services/localEventRecommendationService';
import type { LocalEvent, LocalEventCategory, LocalEventReaction } from '../types';
import { Loader } from './Loader';
import { CalendarPlusIcon, HeartIcon, MapPinIcon, SearchIcon, TicketIcon } from './icons';
import { EventDetailModal } from './EventDetailModal';
import { MicInputButton } from './MicInputButton';
import { usePersistentState } from '../contexts/PersistentStateContext';
import { useCalendar } from '../contexts/CalendarContext';

type EventFilter = 'weekend' | 'today' | 'free' | LocalEventCategory;

const filters: Array<{ id: EventFilter; label: string }> = [
  { id: 'weekend', label: 'This Weekend' },
  { id: 'today', label: 'Today' },
  { id: 'free', label: 'Free' },
  { id: 'family', label: 'Family' },
  { id: 'music', label: 'Music' },
  { id: 'sports', label: 'Sports' },
  { id: 'festival', label: 'Festivals' },
  { id: 'food', label: 'Food' },
  { id: 'outdoors', label: 'Outdoors' },
];

const isFree = (event: LocalEvent) => Boolean(event.price?.toLowerCase().includes('free'));

const filterRecommendation = (recommendation: EventRecommendation, filter: EventFilter | null) => {
  if (!filter) return true;
  if (filter === 'weekend') return isThisWeekend(recommendation.event.date);
  if (filter === 'today') return daysFromToday(recommendation.event.date) === 0;
  if (filter === 'free') return isFree(recommendation.event);
  return recommendation.event.categories.includes(filter);
};

const EventCard: React.FC<{ recommendation: EventRecommendation; onSelect: () => void }> = ({ recommendation, onSelect }) => {
  const { event, score, reasons, hasConflict, weather } = recommendation;
  return (
    <button onClick={onSelect} className="group text-left overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg">
      <div className="relative h-40 bg-slate-100">
        {event.imageUrl && <img src={event.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/70 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-bold text-white">{score}% match</span>
        {event.price && <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2 py-1 text-xs font-bold text-slate-700">{event.price}</span>}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-slate-800">{event.title}</h3>
        <p className="text-sm font-semibold text-teal-700">{formatEventDate(event.date)} · {event.time}</p>
        <p className="flex items-center gap-1 text-sm text-slate-600"><MapPinIcon className="h-4 w-4 shrink-0 text-teal-500" /> <span className="truncate">{event.venue || event.location}</span></p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {weather && <span className="rounded bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">{weather.condition.replace('-', ' ')} · {weather.temp}°</span>}
          <span className={`rounded px-2 py-1 text-xs font-medium ${hasConflict ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{hasConflict ? 'Tight timing' : 'Calendar open'}</span>
        </div>
        <p className="text-xs font-medium text-slate-500">{reasons.join(' · ')}</p>
      </div>
    </button>
  );
};

const RecommendationSection: React.FC<{ title: string; events: EventRecommendation[]; onSelect: (event: EventRecommendation) => void }> = ({ title, events, onSelect }) => {
  if (!events.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-extrabold text-slate-800">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {events.map(recommendation => <EventCard key={recommendation.event.id} recommendation={recommendation} onSelect={() => onSelect(recommendation)} />)}
      </div>
    </section>
  );
};

export const LocalEvents: React.FC<{ onAddCalendarEvent: (title: string, date: string, time: string) => void }> = ({ onAddCalendarEvent }) => {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventRecommendation | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState('');
  const [activeFilter, setActiveFilter] = useState<EventFilter | null>(null);
  const { state: persistentState, setField } = usePersistentState();
  const { events: calendarEvents, weatherData } = useCalendar();
  const location = persistentState.location;
  const preferences = persistentState.localEventPreferences;

  useEffect(() => {
    if (!location) return;
    let active = true;
    setLoading(true);
    getLocalEventDiscovery(location, preferences.radius)
      .then(result => { if (active) { setEvents(result.events); setDiscoveryError(result.error || null); } })
      .catch(error => { console.error('Unable to load local events:', error); if (active) setDiscoveryError('Couldn’t reach event sources right now. Try again in a moment.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [location, preferences.radius]);

  useEffect(() => {
    if (location) return;
    let active = true;
    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then(response => response.json())
      .then(data => {
        if (active && data.city && data.region) setField('location', `${data.city}, ${data.region}`);
      })
      .catch(() => { if (active) { setLoading(false); setIsEditingLocation(true); } });
    return () => { active = false; };
  }, [location, setField]);

  const recommendations = useMemo(() => events
    .filter(event => preferences.reactions[event.id] !== 'notInterested')
    .map(event => scoreLocalEvent(event, calendarEvents, weatherData, preferences))
    .sort((left, right) => right.score - left.score), [events, calendarEvents, weatherData, preferences]);
  const filtered = recommendations.filter(recommendation => filterRecommendation(recommendation, activeFilter));
  const weekendRecommendations = recommendations.filter(item =>
    isThisWeekend(item.event.date) && (new Date().getDay() !== 0 || isLaterToday(item.event)),
  );
  const featured = (weekendRecommendations.length ? weekendRecommendations : recommendations).slice(0, 3);

  const setReaction = (event: LocalEvent, reaction: LocalEventReaction) => {
    setField('localEventPreferences', previous => ({ ...previous, reactions: { ...previous.reactions, [event.id]: reaction }, seen: previous.seen || [] }));
    if (reaction === 'notInterested') setSelected(null);
  };
  const selectRecommendation = (recommendation: EventRecommendation) => {
    setField('localEventPreferences', previous => ({
      ...previous,
      seen: (previous.seen || []).includes(recommendation.event.id) ? previous.seen || [] : [...(previous.seen || []), recommendation.event.id],
    }));
    setSelected(recommendation);
  };

  const saveLocation = () => {
    if (!tempLocation.trim()) return;
    setField('location', tempLocation.trim());
    setIsEditingLocation(false);
  };

  const today = recommendations.filter(item => isLaterToday(item.event)).slice(0, 6);
  const nearestWeekend = nearestWeekendDateKeys();
  const saturday = recommendations.filter(item => item.event.date === nearestWeekend.saturday).slice(0, 6);
  const sunday = recommendations.filter(item => item.event.date === nearestWeekend.sunday && (new Date().getDay() !== 0 || isLaterToday(item.event))).slice(0, 6);

  if (loading) return <Loader message="Finding the best things to do nearby..." />;

  return (
    <div className="space-y-7 pb-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-lg font-extrabold text-slate-800"><MapPinIcon className="h-5 w-5 text-teal-600" /> {location || 'Set your location'} <span className="font-medium text-slate-400">· search area: {preferences.radius} mi</span></p>
            <button onClick={() => { setTempLocation(location); setIsEditingLocation(true); }} className="mt-1 text-sm font-semibold text-teal-600 hover:text-teal-700">Change location</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {([25, 50, 75, 100] as const).map(radius => <button key={radius} onClick={() => setField('localEventPreferences', previous => ({ ...previous, radius }))} className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${preferences.radius === radius ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{radius} mi</button>)}
          </div>
        </div>
        {isEditingLocation && <div className="mt-4 flex max-w-xl gap-2 rounded-xl bg-slate-50 p-2">
          <SearchIcon className="ml-2 mt-2 h-5 w-5 text-slate-400" />
          <input autoFocus value={tempLocation} onChange={event => setTempLocation(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') saveLocation(); }} placeholder="Glasgow, KY" className="min-w-0 flex-1 bg-transparent px-2 py-1 outline-none" />
          <MicInputButton onTranscription={setTempLocation} />
          <button onClick={saveLocation} className="rounded-lg bg-slate-800 px-4 py-1.5 font-bold text-white">Search</button>
        </div>}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map(filter => <button key={filter.id} onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold transition ${activeFilter === filter.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{filter.label}</button>)}
        </div>
      </header>

      {!location ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">Choose a location to see nearby recommendations.</div> : <>
        <RecommendationSection title="🔥 Best bets this weekend" events={activeFilter ? featured.filter(item => filterRecommendation(item, activeFilter)) : featured} onSelect={selectRecommendation} />
        {activeFilter ? <RecommendationSection title="Matches your filters" events={filtered} onSelect={selectRecommendation} /> : <>
          <RecommendationSection title="Tonight" events={today} onSelect={selectRecommendation} />
          <RecommendationSection title="Saturday" events={saturday} onSelect={selectRecommendation} />
          <RecommendationSection title="Sunday" events={sunday} onSelect={selectRecommendation} />
          <RecommendationSection title="Worth exploring" events={recommendations.filter(item => !today.includes(item) && !saturday.includes(item) && !sunday.includes(item)).slice(0, 6)} onSelect={selectRecommendation} />
        </>}
        {!recommendations.length && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">{discoveryError || 'No nearby events matched your preferences. Try a wider search area.'}</div>}
      </>}

      {selected && <EventDetailModal event={selected.event} recommendation={selected} reaction={preferences.reactions[selected.event.id]} onClose={() => setSelected(null)} onReaction={setReaction} onAddEvent={event => onAddCalendarEvent(event.title, event.date, event.time)} />}
    </div>
  );
};
