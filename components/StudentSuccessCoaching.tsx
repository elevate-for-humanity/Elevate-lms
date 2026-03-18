"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CoachingSession {
  id: string;
  date: string;
  topic: string;
  coach: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  dueDate: string;
  status: 'on-track' | 'at-risk' | 'completed';
}

export function StudentSuccessCoaching() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'goals' | 'resources'>('dashboard');

  const sessions: CoachingSession[] = [
    {
      id: '1',
      date: '2024-02-15',
      topic: 'Time Management Strategies',
      coach: 'Dr. Emily Rodriguez',
      status: 'scheduled',
    },
    {
      id: '2',
      date: '2024-01-20',
      topic: 'Career Planning',
      coach: 'Michael Thompson',
      status: 'completed',
      notes: 'Discussed career goals and created action plan',
    },
  ];

  const goals: Goal[] = [
    {
      id: '1',
      title: 'Complete Web Development Course',
      category: 'Academic',
      progress: 75,
      dueDate: '2024-03-31',
      status: 'on-track',
    },
    {
      id: '2',
      title: 'Build Portfolio Website',
      category: 'Career',
      progress: 40,
      dueDate: '2024-02-28',
      status: 'at-risk',
    },
    {
      id: '3',
      title: 'Attend 5 Networking Events',
      category: 'Professional Development',
      progress: 100,
      dueDate: '2024-01-31',
      status: 'completed',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Success Coaching</h2>
          <p className="text-brand-red-100">Your personalized path to success</p>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {(['dashboard', 'sessions', 'goals', 'resources'] as const).map((tab) => (
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
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm text-black mb-2">Coaching Sessions</h3>
              <p className="text-3xl font-bold text-brand-orange-600">{sessions.length}</p>
              <p className="text-sm text-gray-500">1 upcoming</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm text-black mb-2">Active Goals</h3>
              <p className="text-3xl font-bold text-brand-orange-500">{goals.filter(g => g.status !== 'completed').length}</p>
              <p className="text-sm text-gray-500">2 in progress</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm text-black mb-2">Success Rate</h3>
              <p className="text-3xl font-bold text-brand-green-600">85%</p>
              <p className="text-sm text-gray-500">Above average</p>
            </Card>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Coaching Sessions</h2>
              <Button>Schedule New Session</Button>
            </div>
            {sessions.map((session) => (
              <Card key={session.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{session.topic}</h3>
                    <p className="text-black">Coach: {session.coach}</p>
                    <p className="text-sm text-gray-500">{session.date}</p>
                    {session.notes && (
                      <p className="mt-2 text-sm text-black">{session.notes}</p>
                    )}
                  </div>
                  <span className={`px-3 py-2 rounded text-sm ${
                    session.status === 'scheduled' ? 'bg-brand-blue-100 text-brand-blue-700' :
                    session.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700' :
                    'bg-gray-100 text-black'
                  }`}>
                    {session.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Goals</h2>
              <Button>Add New Goal</Button>
            </div>
            {goals.map((goal) => (
              <Card key={goal.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{goal.title}</h3>
                    <p className="text-sm text-black">{goal.category}</p>
                    <p className="text-sm text-gray-500">Due: {goal.dueDate}</p>
                  </div>
                  <span className={`px-3 py-2 rounded text-sm ${
                    goal.status === 'on-track' ? 'bg-brand-green-100 text-brand-green-700' :
                    goal.status === 'at-risk' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-brand-blue-100 text-brand-blue-700'
                  }`}>
                    {goal.status}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-semibold">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="   h-2 rounded-full"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Study Skills</h3>
              <ul className="space-y-2">
                <li className="text-brand-blue-600 hover:underline cursor-pointer">Time Management Guide</li>
                <li className="text-brand-blue-600 hover:underline cursor-pointer">Note-Taking Strategies</li>
                <li className="text-brand-blue-600 hover:underline cursor-pointer">Test Preparation Tips</li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Career Resources</h3>
              <ul className="space-y-2">
                <li className="text-brand-blue-600 hover:underline cursor-pointer">Resume Writing Workshop</li>
                <li className="text-brand-blue-600 hover:underline cursor-pointer">Interview Preparation</li>
                <li className="text-brand-blue-600 hover:underline cursor-pointer">Networking Strategies</li>
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
