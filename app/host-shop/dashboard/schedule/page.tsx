'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  Users,
  Check,
} from 'lucide-react';

const currentDate = new Date('2026-06-15');

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const events = [
  { id: 1, title: 'Competency Review - Marcus J.', time: '10:00 AM', type: 'competency', day: 15 },
  { id: 2, title: 'Class - Haircutting Basics', time: '2:00 PM', type: 'class', day: 16 },
  { id: 3, title: 'Evaluation - DeShawn W.', time: '11:00 AM', type: 'evaluation', day: 18 },
  { id: 4, title: 'Practical Session', time: '9:00 AM', type: 'practical', day: 20 },
];

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState<number | null>(15);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getEventsForDay = (day: number) => events.filter(e => e.day === day);

  const renderCalendar = () => {
    const calendarDays = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-slate-50"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = day === 15 && currentMonth === 5 && currentYear === 2026;
      const isSelected = day === selectedDay;
      
      calendarDays.push(
        <button
          key={day}
          onClick={() => setSelectedDay(day)}
          className={`h-24 p-2 border border-slate-100 text-left transition hover:bg-slate-50 ${
            isToday ? 'bg-brand-blue-50' : ''
          } ${isSelected ? 'ring-2 ring-brand-blue-500' : ''}`}
        >
          <span className={`text-sm font-medium ${isToday ? 'text-brand-blue-600' : 'text-slate-700'}`}>
            {day}
          </span>
          <div className="mt-1 space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div key={event.id} className={`text-xs px-1.5 py-0.5 rounded truncate ${
                event.type === 'competency' ? 'bg-green-100 text-green-700' :
                event.type === 'class' ? 'bg-blue-100 text-blue-700' :
                event.type === 'evaluation' ? 'bg-amber-100 text-amber-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {event.title.split(' - ')[0]}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <span className="text-xs text-slate-500">+{dayEvents.length - 2} more</span>
            )}
          </div>
        </button>
      );
    }
    
    return calendarDays;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard" className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </Link>
              <div>
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Schedule</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-xl font-medium hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Schedule</h1>
          <p className="text-slate-500">Manage apprentice schedules and upcoming events</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-lg font-bold text-slate-900">
                {months[currentMonth]} {currentYear}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {days.map(day => (
                <div key={day} className="p-2 text-center text-sm font-semibold text-slate-500 border-b border-slate-100">
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>

          {/* Events Sidebar */}
          <div className="space-y-4">
            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {events.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      event.type === 'competency' ? 'bg-green-100' :
                      event.type === 'class' ? 'bg-blue-100' :
                      event.type === 'evaluation' ? 'bg-amber-100' :
                      'bg-purple-100'
                    }`}>
                      {event.type === 'competency' && <Check className="w-5 h-5 text-green-600" />}
                      {event.type === 'class' && <Users className="w-5 h-5 text-blue-600" />}
                      {event.type === 'evaluation' && <CalendarIcon className="w-5 h-5 text-amber-600" />}
                      {event.type === 'practical' && <Clock className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{event.title}</p>
                      <p className="text-xs text-slate-500">June {event.day}, 2026 • {event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span className="text-sm text-slate-600">Competency Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 rounded"></div>
                  <span className="text-sm text-slate-600">Class / Training</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-100 rounded"></div>
                  <span className="text-sm text-slate-600">Evaluation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-100 rounded"></div>
                  <span className="text-sm text-slate-600">Practical Session</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
