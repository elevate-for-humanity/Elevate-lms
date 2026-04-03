"use client";

import React from 'react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Meeting {
  id: string;
  title: string;
  host: string;
  date: string;
  time: string;
  duration: string;
  participants: number;
  status: 'upcoming' | 'live' | 'ended';
}

export function VideoConferencingIntegration() {
  const meetings: Meeting[] = [
    {
      id: '1',
      title: 'JavaScript Advanced Workshop',
      host: 'Dr. Sarah Chen',
      date: '2024-02-01',
      time: '2:00 PM',
      duration: '2 hours',
      participants: 45,
      status: 'upcoming',
    },
    {
      id: '2',
      title: 'React Q&A Session',
      host: 'Alex Kim',
      date: '2024-01-30',
      time: '4:00 PM',
      duration: '1 hour',
      participants: 32,
      status: 'live',
    },
    {
      id: '3',
      title: 'Career Counseling',
      host: 'Graduate',
      date: '2024-01-28',
      time: '10:00 AM',
      duration: '30 minutes',
      participants: 1,
      status: 'ended',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Video Conferencing</h1>
          <p className="text-white">Join live sessions and meetings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Meetings</h2>
          <Button>Schedule Meeting</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold">{meeting.title}</h3>
                <span className={`px-3 py-2 rounded text-xs font-medium ${
                  meeting.status === 'live' ? 'bg-brand-red-100 text-brand-red-700' :
                  meeting.status === 'upcoming' ? 'bg-brand-blue-100 text-brand-blue-700' :
                  'bg-gray-100 text-black'
                }`}>
                  {meeting.status === 'live' && '🔴 '}{meeting.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-sm text-black mb-4">
                <p>👤 Host: {meeting.host}</p>
                <p>📅 {meeting.date} at {meeting.time}</p>
                <p>⏱️ Duration: {meeting.duration}</p>
                <p>👥 {meeting.participants} participants</p>
              </div>

              {meeting.status === 'live' && (
                <Button className="w-full bg-brand-orange-600 hover:bg-brand-orange-700">Join Now</Button>
              )}
              {meeting.status === 'upcoming' && (
                <Button className="w-full" variant="secondary">Add to Calendar</Button>
              )}
              {meeting.status === 'ended' && (
                <Button className="w-full" variant="secondary">View Recording</Button>
              )}
            </Card>
          ))}
        </div>

        <Card className="p-6 mt-8   ">
          <h3 className="text-xl font-bold mb-4">Quick Start a Meeting</h3>
          <div className="flex gap-4">
            <Button className="flex-1">Start Instant Meeting</Button>
            <Button variant="secondary" className="flex-1">Schedule for Later</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
