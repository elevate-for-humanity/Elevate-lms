"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Employer {
  id: string;
  name: string;
  logo: string;
  industry: string;
  booth: string;
  openPositions: number;
  representatives: string[];
  description: string;
}

interface Session {
  id: string;
  title: string;
  time: string;
  speaker: string;
  type: 'workshop' | 'panel' | 'presentation';
}

export default function VirtualCareerFair() {
  const [activeTab, setActiveTab] = useState<'exhibitors' | 'schedule' | 'networking'>('exhibitors');

  const employers: Employer[] = [
    {
      id: '1',
      name: 'Tech Innovations Corp',
      logo: '💻',
      industry: 'Technology',
      booth: 'Virtual Booth A1',
      openPositions: 12,
      representatives: ['John Smith', 'Lisa Chen'],
      description: 'Leading software development company seeking talented developers',
    },
    {
      id: '2',
      name: 'Healthcare Solutions',
      logo: '🏥',
      industry: 'Healthcare',
      booth: 'Virtual Booth B2',
      openPositions: 8,
      representatives: ['Dr. Maria Garcia'],
      description: 'Healthcare provider hiring nurses and medical assistants',
    },
    {
      id: '3',
      name: 'Green Energy Inc',
      logo: '⚡',
      industry: 'Energy',
      booth: 'Virtual Booth C3',
      openPositions: 5,
      representatives: ['David Wilson', 'Emma Brown'],
      description: 'Renewable energy company looking for HVAC technicians',
    },
  ];

  const sessions: Session[] = [
    {
      id: '1',
      title: 'Resume Writing Workshop',
      time: '10:00 AM - 11:00 AM',
      speaker: 'Career Coach Sarah Johnson',
      type: 'workshop',
    },
    {
      id: '2',
      title: 'Tech Industry Panel Discussion',
      time: '11:30 AM - 12:30 PM',
      speaker: 'Industry Leaders',
      type: 'panel',
    },
    {
      id: '3',
      title: 'Interview Skills Masterclass',
      time: '2:00 PM - 3:00 PM',
      speaker: 'HR Director Michael Chen',
      type: 'workshop',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Virtual Career Fair 2024</h2>
          <p className="text-white">Connect with top employers from anywhere</p>
          <div className="mt-4 flex gap-4">
            <div className="bg-white/20 px-4 py-2 rounded">
              <span className="font-bold">{employers.length}</span> Employers
            </div>
            <div className="bg-white/20 px-4 py-2 rounded">
              <span className="font-bold">{employers.reduce((sum, e) => sum + e.openPositions, 0)}</span> Open Positions
            </div>
            <div className="bg-white/20 px-4 py-2 rounded">
              <span className="font-bold">{sessions.length}</span> Sessions
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {(['exhibitors', 'schedule', 'networking'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium ${
                  activeTab === tab ? 'border-brand-red-600 text-brand-orange-600' : 'border-transparent text-gray-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'exhibitors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employers.map((employer) => (
              <Card key={employer.id} className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-5xl text-3xl md:text-4xl lg:text-5xl">{employer.logo}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{employer.name}</h3>
                    <p className="text-sm text-black">{employer.industry}</p>
                    <p className="text-sm text-brand-orange-600 font-semibold mt-1">
                      {employer.openPositions} open positions
                    </p>
                  </div>
                </div>

                <p className="text-black text-sm mb-4">{employer.description}</p>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-black mb-1">Representatives:</p>
                  <p className="text-sm text-black">{employer.representatives.join(', ')}</p>
                </div>

                <div className="space-y-2">
                  <Button className="w-full">Visit Booth</Button>
                  <Button variant="secondary" className="w-full">View Positions</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Event Schedule</h2>
            {sessions.map((session) => (
              <Card key={session.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-2 rounded text-xs font-medium ${
                        session.type === 'workshop' ? 'bg-brand-blue-100 text-brand-blue-700' :
                        session.type === 'panel' ? 'bg-purple-100 text-purple-700' :
                        'bg-brand-green-100 text-brand-green-700'
                      }`}>
                        {session.type}
                      </span>
                      <span className="text-sm text-black">{session.time}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{session.title}</h3>
                    <p className="text-black">Speaker: {session.speaker}</p>
                  </div>
                  <Button>Register</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'networking' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-4xl md:text-5xl lg:text-6xl">💬</div>
            <h2 className="text-2xl font-bold mb-4">Networking Lounge</h2>
            <p className="text-black mb-6">Connect with other attendees and employers</p>
            <div className="flex gap-4 justify-center">
              <Button>Join Video Chat</Button>
              <Button variant="secondary">Browse Attendees</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
