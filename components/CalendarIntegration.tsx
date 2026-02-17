"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'class' | 'meeting' | 'deadline' | 'event';
  description: string;
}

export function CalendarIntegration() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const events: Event[] = [
    {
      id: '1',
      title: 'JavaScript Workshop',
      date: '2024-02-01',
      time: '2:00 PM',
      type: 'class',
      description: 'Advanced JavaScript concepts',
    },
    {
      id: '2',
      title: 'Assignment Due',
      date: '2024-02-03',
      time: '11:59 PM',
      type: 'deadline',
      description: 'React project submission',
    },
    {
      id: '3',
      title: 'Career Counseling',
      date: '2024-02-05',
      time: '10:00 AM',
      type: 'meeting',
      description: 'One-on-one session',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-brand-blue-100 text-brand-blue-700';
      case 'meeting': return 'bg-brand-green-100 text-brand-green-700';
      case 'deadline': return 'bg-brand-red-100 text-brand-red-700';
      default: return 'bg-purple-100 text-purple-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Calendar</h1>
          <p className="text-brand-red-100">Manage your schedule and events</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">February 2024</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">← Prev</Button>
                  <Button size="sm" variant="secondary">Next →</Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-semibold text-sm text-black">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 2;
                  const hasEvent = events.some(e => new Date(e.date).getDate() === day);
                  return (
                    <div
                      key={i}
                      className={`aspect-square flex items-center justify-center rounded-lg cursor-pointer ${
                        day > 0 && day <= 29
                          ? hasEvent
                            ? 'bg-brand-red-100 text-brand-red-700 font-bold'
                            : 'bg-white hover:bg-gray-50'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {day > 0 && day <= 29 ? day : ''}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold">{event.title}</h4>
                        <p className="text-sm text-black">{event.description}</p>
                      </div>
                      <span className={`px-2 py-2 rounded text-xs font-medium ${getTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      📅 {event.date} at {event.time}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button className="w-full">Add Event</Button>
                <Button variant="secondary" className="w-full">Sync with Google</Button>
                <Button variant="secondary" className="w-full">Export Calendar</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Event Types</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand-blue-500 rounded" />
                  <span>Classes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand-green-500 rounded" />
                  <span>Meetings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand-orange-500 rounded" />
                  <span>Deadlines</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded" />
                  <span>Events</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
