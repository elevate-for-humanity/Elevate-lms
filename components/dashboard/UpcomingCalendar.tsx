"use client";

import { Calendar, Clock } from 'lucide-react';

const events = [
  {
    id: 1,
    title: 'Module 3 Quiz',
    course: 'CNA Certification',
    date: 'Nov 15, 2024',
    time: '2:00 PM',
    type: 'quiz',
  },
  {
    id: 2,
    title: 'Live Session',
    course: 'HVAC Training',
    date: 'Nov 16, 2024',
    time: '10:00 AM',
    type: 'session',
  },
  {
    id: 3,
    title: 'Assignment Due',
    course: 'CNA Certification',
    date: 'Nov 18, 2024',
    time: '11:59 PM',
    type: 'assignment',
  },
];

export function UpcomingCalendar() {
  return (
    <div className="elevate-card">
      <div className="elevate-card-header">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand-orange-600" />
          <h3 className="elevate-card-title">Upcoming Events</h3>
        </div>
      </div>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-brand-red-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-black text-sm">
                  {event.title}
                </h4>
                <p className="text-xs text-black mt-1">{event.course}</p>
              </div>
              <span className="elevate-pill elevate-pill--red text-xs">
                {event.type}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {event.date}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {event.time}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 text-center text-sm font-medium text-brand-orange-600 hover:text-brand-red-700">
        View Full Calendar →
      </button>
    </div>
  );
}
