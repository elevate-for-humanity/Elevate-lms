'use client';

import { useCallback, useEffect, useState } from 'react';
import { GoogleCalendarConnection } from './GoogleCalendarConnection';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: 'assignment' | 'quiz' | 'deadline' | 'class' | 'event';
  course?: string;
  time?: string;
  startsAt?: string;
  endsAt?: string;
  source?: 'google';
};

export function CalendarWidget({
  userId,
  additionalEvents = [],
}: {
  userId: string;
  additionalEvents?: CalendarEvent[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState('');
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [googleError, setGoogleError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadEvents = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    setError('');
    setGoogleError('');
    const google = (async () => {
      try {
        const range = new URLSearchParams({ start: new Date(year, month - 1, 1).toISOString(), end: new Date(year, month, 1).toISOString() });
        const response = await fetch(`/api/calendar/google?${range}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Google Calendar could not be checked.');
        setGoogleEvents(Array.isArray(result.events) ? result.events : []);
      } catch { setGoogleEvents([]); setGoogleError('Google busy times could not be checked. Refresh or reconnect Google Calendar before booking.'); }
    })();
    try {
      const res = await fetch(
        `/api/calendar/events?year=${year}&month=${month}&userId=${encodeURIComponent(userId)}`,
      );
      if (!res.ok) throw new Error('Calendar unavailable');
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch {
      setEvents([]);
      setError(
        'Calendar events could not be loaded. Try another month or contact learner support.',
      );
    }
    await google;
  }, [currentDate, userId]);

  useEffect(() => {
    void loadEvents();
    const refresh = () => void loadEvents();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [loadEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = new Date(year, month, 1).getDay();
  const dateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dateEvents = (date: Date) =>
    [
      ...events,
      ...[...additionalEvents, ...googleEvents].map((event) =>
        event.startsAt
          ? {
              ...event,
              date: dateKey(new Date(event.startsAt)),
              time: new Date(event.startsAt).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              }),
            }
          : event,
      ),
    ].filter((event) => event.startsAt && event.endsAt
      ? Date.parse(event.startsAt) < new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime() && Date.parse(event.endsAt) > date.getTime()
      : event.date === dateKey(date));
  const eventColor = (type: CalendarEvent['type']) =>
    ({
      assignment: 'bg-blue-500',
      quiz: 'bg-purple-500',
      deadline: 'bg-orange-500',
      class: 'bg-green-500',
      event: 'bg-slate-500',
    })[type];
  const selectedDateEvents = selectedDate ? dateEvents(selectedDate) : [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <GoogleCalendarConnection onRefresh={loadEvents} />
      {googleError ? <p role="alert" className="mb-4 text-sm font-bold text-amber-900">{googleError}</p> : null}
      {error ? (
        <p role="alert" className="mb-4 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-black">Calendar</h2>
        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(year, month - 1))}
            className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-0 flex-1 text-center text-sm font-medium text-black sm:min-w-[150px] sm:flex-none">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(year, month + 1))}
            className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-slate-700">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const date = new Date(year, month, index + 1);
          const dayEvents = dateEvents(date);
          const selected = selectedDate?.toDateString() === date.toDateString();
          return (
            <button
              key={index}
              type="button"
              aria-label={date.toLocaleDateString('en-US', { dateStyle: 'full' })}
              aria-pressed={selected}
              onClick={() => setSelectedDate(date)}
              className={`aspect-square rounded-lg border p-1 ${selected ? 'border-brand-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <span className="text-sm font-medium">{index + 1}</span>
              {dayEvents.length ? (
                <div className="mt-1 flex justify-center gap-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className={`h-1.5 w-1.5 rounded-full ${eventColor(event.type)}`}
                    />
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      {selectedDate ? (
        <div className="mt-5 border-t pt-4">
          <h3 className="mb-3 font-semibold">{selectedDate.toLocaleDateString()}</h3>
          {selectedDateEvents.length ? (
            <div className="space-y-2">
              {selectedDateEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <span className={`h-2 w-2 rounded-full ${eventColor(event.type)}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.course ? <p className="text-xs text-slate-600">{event.course}</p> : null}
                  </div>
                  {event.time ? (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No events scheduled.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default CalendarWidget;
