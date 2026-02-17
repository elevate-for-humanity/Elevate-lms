"use client";

import React from 'react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  completed: boolean;
  dueDate: string;
}

export function CourseCompletionTracking() {
  const milestones: Milestone[] = [
    {
      id: '1',
      title: 'Introduction Module',
      description: 'Complete all introductory lessons and quizzes',
      progress: 100,
      completed: true,
      dueDate: '2024-01-10',
    },
    {
      id: '2',
      title: 'Core Concepts',
      description: 'Master fundamental programming concepts',
      progress: 100,
      completed: true,
      dueDate: '2024-01-20',
    },
    {
      id: '3',
      title: 'Practical Projects',
      description: 'Build 3 hands-on projects',
      progress: 67,
      completed: false,
      dueDate: '2024-02-01',
    },
    {
      id: '4',
      title: 'Advanced Topics',
      description: 'Explore advanced programming patterns',
      progress: 0,
      completed: false,
      dueDate: '2024-02-15',
    },
    {
      id: '5',
      title: 'Final Project',
      description: 'Complete capstone project',
      progress: 0,
      completed: false,
      dueDate: '2024-02-28',
    },
  ];

  const overallProgress = Math.round(
    milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Course Completion</h1>
          <p className="text-brand-red-100">Track your progress through milestones</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Overall Progress</h2>
            <span className="text-3xl font-bold text-brand-orange-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="   h-4 rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-sm text-black mt-2">
            {milestones.filter(m => m.completed).length} of {milestones.length} milestones completed
          </p>
        </Card>

        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <Card key={milestone.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                  milestone.completed ? 'bg-brand-green-500 text-white' :
                  milestone.progress > 0 ? 'bg-brand-blue-500 text-white' :
                  'bg-gray-300 text-black'
                }`}>
                  {milestone.completed ? '•' : index + 1}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold">{milestone.title}</h3>
                      <p className="text-sm text-black">{milestone.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {milestone.dueDate}</p>
                    </div>
                    <span className="text-2xl font-bold text-brand-orange-600">{milestone.progress}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="   h-2 rounded-full"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>

                  {!milestone.completed && milestone.progress > 0 && (
                    <Button size="sm">Continue</Button>
                  )}
                  {!milestone.completed && milestone.progress === 0 && (
                    <Button size="sm" variant="secondary">Start</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
