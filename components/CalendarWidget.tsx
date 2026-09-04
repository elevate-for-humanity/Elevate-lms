'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: 'assignment' | 'quiz' | 'deadline' | 'class' | 'event';
  course?: string;
  time?: string;
};

export function CalendarWidget({ userId }: { userId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadEvents = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const res = await fetch(`/api/calendar/events?year=${year}&month=${month}&userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    }
  }, [currentDate, userId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = new Date(year, month, 1).getDay();
  const dateEvents = (date: Date) => events.filter((event) => event.date === date.toISOString().split('T')[0]);
  const eventColor = (type: CalendarEvent['type']) => ({ assignment: 'bg-blue-500', quiz: 'bg-purple-500', deadline: 'bg-orange-500', class: 'bg-green-500', event: 'bg-slate-500' }[type]);
  const selectedDateEvents = selectedDate ? dateEvents(selectedDate) : [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-black">Calendar</h2>
        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
          <button type="button" onClick={() => setCurrentDate(new Date(year, month - 1))} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></button>
          <span className="min-w-0 flex-1 text-center text-sm font-medium text-black sm:min-w-[150px] sm:flex-none">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button type="button" onClick={() => setCurrentDate(new Date(year, month + 1))} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Next month"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-2 text-center text-xs font-semibold text-slate-700">{day}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startingDayOfWeek }).map((_, index) => <div key={`empty-${index}`} className="aspect-square" />)}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const date = new Date(year, month, index + 1);
          const dayEvents = dateEvents(date);
          const selected = selectedDate?.toDateString() === date.toDateString();
          return <button key={index} type="button" onClick={() => setSelectedDate(date)} className={`aspect-square rounded-lg border p-1 ${selected ? 'border-brand-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}><span className="text-sm font-medium">{index + 1}</span>{dayEvents.length ? <div className="mt-1 flex justify-center gap-0.5">{dayEvents.slice(0, 3).map((event) => <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${eventColor(event.type)}`} />)}</div> : null}</button>;
        })}
      </div>
      {selectedDate ? <div className="mt-5 border-t pt-4"><h3 className="mb-3 font-semibold">{selectedDate.toLocaleDateString()}</h3>{selectedDateEvents.length ? <div className="space-y-2">{selectedDateEvents.map((event) => <div key={event.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"><span className={`h-2 w-2 rounded-full ${eventColor(event.type)}`} /><div className="flex-1"><p className="text-sm font-medium">{event.title}</p>{event.course ? <p className="text-xs text-slate-600">{event.course}</p> : null}</div>{event.time ? <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{event.time}</span> : null}</div>)}</div> : <p className="text-sm text-slate-500">No events scheduled.</p>}</div> : null}
    </section>
  );
}

export default CalendarWidget;
