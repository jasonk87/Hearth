import React from 'react';
import type { LocalEvent, LocalEventReaction } from '../types';
import type { EventRecommendation } from '../services/localEventRecommendationService';
import { formatEventDate } from '../services/localEventRecommendationService';
import { XIcon, MapPinIcon, ClockIcon, CalendarPlusIcon, HeartIcon, TicketIcon } from './icons';

interface EventDetailModalProps {
  event: LocalEvent;
  recommendation: EventRecommendation;
  reaction?: LocalEventReaction;
  onClose: () => void;
  onAddEvent: (event: LocalEvent) => void;
  onReaction: (event: LocalEvent, reaction: LocalEventReaction) => void;
}

const ActionButton: React.FC<{ active?: boolean; children: React.ReactNode; onClick: () => void }> = ({ active, children, onClick }) => (
  <button onClick={onClick} className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${active ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-700'}`}>{children}</button>
);

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, recommendation, reaction, onClose, onAddEvent, onReaction }) => {
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || event.location)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="relative h-60 shrink-0 bg-slate-100 sm:h-72">
          {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white backdrop-blur-md hover:bg-black/60"><XIcon className="h-5 w-5" /></button>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <span className="rounded-full bg-teal-500 px-2.5 py-1 text-xs font-bold">{recommendation.score}% Hearth match</span>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight drop-shadow-md">{event.title}</h2>
          </div>
        </div>
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <ActionButton active={reaction === 'interested'} onClick={() => onReaction(event, 'interested')}><span className="inline-flex items-center gap-1"><HeartIcon className="h-4 w-4" /> Interested</span></ActionButton>
            <ActionButton active={reaction === 'going'} onClick={() => onReaction(event, 'going')}>✓ Going</ActionButton>
            <ActionButton active={reaction === 'notInterested'} onClick={() => onReaction(event, 'notInterested')}>× Not for us</ActionButton>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <ClockIcon className="mt-1 h-5 w-5 shrink-0 text-teal-600" />
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date & time</p><p className="font-bold text-slate-800">{formatEventDate(event.date)}</p><p className="text-slate-600">{event.time}</p></div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <MapPinIcon className="mt-1 h-5 w-5 shrink-0 text-teal-600" />
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Venue</p><p className="font-bold text-slate-800">{event.venue || event.location}</p><p className="text-slate-600">{event.location}</p></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {event.categories.map(category => <span key={category} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize text-slate-600">{category}</span>)}
            {event.price && <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{event.price}</span>}
            {recommendation.weather && <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold capitalize text-sky-700">{recommendation.weather.condition.replace('-', ' ')} · {recommendation.weather.temp}°</span>}
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${recommendation.hasConflict ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{recommendation.hasConflict ? 'Calendar conflict' : 'No calendar conflicts'}</span>
          </div>

          {event.description && <div><h3 className="mb-2 text-lg font-extrabold text-slate-800">About this event</h3><p className="whitespace-pre-wrap leading-relaxed text-slate-600">{event.description}</p></div>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 font-bold text-slate-700 hover:border-teal-300"><MapPinIcon className="h-5 w-5" /> Directions</a>
            {event.ticketUrl && <a href={event.ticketUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 font-bold text-slate-700 hover:border-teal-300"><TicketIcon className="h-5 w-5" /> Tickets</a>}
            {event.sourceUrl && <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 font-bold text-slate-700 hover:border-teal-300">Official site</a>}
          </div>

          <button onClick={() => { onAddEvent(event); onReaction(event, 'going'); onClose(); }} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-lg font-bold text-white shadow-md transition hover:bg-teal-600"><CalendarPlusIcon className="h-6 w-6" /> Add to calendar</button>
        </div>
      </div>
    </div>
  );
};
