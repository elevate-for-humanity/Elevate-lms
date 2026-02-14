"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'assignment' | 'quiz' | 'deadline' | 'class' | 'event';
  course?: string;
  time?: string;
}

interface CalendarWidgetProps {
  userId: string;
}

export function CalendarWidget({ userId }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate, userId]);

  async function loadEvents() {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(`/api/calendar/events?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getEventColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-brand-blue-500';
      case 'quiz':
        return 'bg-purple-500';
      case 'deadline':
        return 'bg-brand-orange-500';
      case 'class':
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
    }
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-black">Calendar</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-black min-w-[150px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-black py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateEvents = getEventsForDate(date);
            const isToday =
              date.toDateString() === new Date().toDateString();
            const isSelected =
              selectedDate?.toDateString() === date.toDateString();

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square p-1 rounded-lg border transition ${
                  isSelected
                    ? 'border-emerald-500 bg-red-50'
                    : isToday
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-medium text-black">{day}</div>
                {dateEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {dateEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.type)}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-black mb-3">
            {selectedDate.toLocaleDateString('default', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${getEventColor(event.type)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black">{event.title}</p>
                    {event.course && (
                      <p className="text-xs text-black mt-0.5">{event.course}</p>
                    )}
                    {event.time && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </div>
                    )}
                  </div>
                  <span className="text-xs px-2 py-2 bg-white rounded text-black capitalize">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              No events scheduled
            </p>
          )}
        </div>
      )}

      {/* Upcoming Events */}
      <div className="border-t border-slate-200 pt-4 mt-4">
        <h4 className="text-sm font-semibold text-black mb-3">Upcoming</h4>
        <div className="space-y-2">
          {events
            .filter(event => new Date(event.date) >= new Date())
            .slice(0, 5)
            .map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 text-sm"
              >
                <div className={`w-2 h-2 rounded-full ${getEventColor(event.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-black truncate">{event.title}</p>
                  <p className="text-xs text-black">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
