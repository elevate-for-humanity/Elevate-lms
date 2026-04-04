"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Competency {
  id: string;
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  progress: number;
  assessments: number;
  lastAssessed: string;
  status: 'not-started' | 'in-progress' | 'mastered';
}

export default function CompetencyTracking() {
  const [activeCategory, setActiveCategory] = useState('all');

  const competencies: Competency[] = [
    {
      id: '1',
      name: 'JavaScript Programming',
      category: 'Technical',
      level: 'advanced',
      progress: 85,
      assessments: 12,
      lastAssessed: '2024-01-15',
      status: 'in-progress',
    },
    {
      id: '2',
      name: 'React Framework',
      category: 'Technical',
      level: 'intermediate',
      progress: 70,
      assessments: 8,
      lastAssessed: '2024-01-10',
      status: 'in-progress',
    },
    {
      id: '3',
      name: 'Problem Solving',
      category: 'Soft Skills',
      level: 'advanced',
      progress: 90,
      assessments: 15,
      lastAssessed: '2024-01-20',
      status: 'mastered',
    },
    {
      id: '4',
      name: 'Team Collaboration',
      category: 'Soft Skills',
      level: 'intermediate',
      progress: 75,
      assessments: 10,
      lastAssessed: '2024-01-12',
      status: 'in-progress',
    },
    {
      id: '5',
      name: 'Database Design',
      category: 'Technical',
      level: 'intermediate',
      progress: 60,
      assessments: 6,
      lastAssessed: '2024-01-08',
      status: 'in-progress',
    },
    {
      id: '6',
      name: 'Project Management',
      category: 'Professional',
      level: 'beginner',
      progress: 40,
      assessments: 4,
      lastAssessed: '2024-01-05',
      status: 'in-progress',
    },
  ];

  const categories = ['all', ...Array.from(new Set(competencies.map(c => c.category)))];
  const filteredCompetencies = activeCategory === 'all'
    ? competencies
    : competencies.filter(c => c.category === activeCategory);

  const levelColors: Record<string, string> = {
    beginner: 'bg-brand-blue-100 text-brand-blue-700',
    intermediate: 'bg-purple-100 text-purple-700',
    advanced: 'bg-brand-orange-100 text-brand-orange-700',
    expert: 'bg-brand-red-100 text-brand-red-700',
  };

  const statusColors: Record<string, string> = {
    'not-started': 'bg-gray-100 text-black',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    'mastered': 'bg-brand-green-100 text-brand-green-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Competency Tracking</h1>
          <p className="text-white">Monitor your skill development and mastery</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Total Competencies</h3>
            <p className="text-3xl font-bold text-brand-orange-600">{competencies.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Mastered</h3>
            <p className="text-3xl font-bold text-brand-green-600">
              {competencies.filter(c => c.status === 'mastered').length}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {competencies.filter(c => c.status === 'in-progress').length}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Avg Progress</h3>
            <p className="text-3xl font-bold text-brand-orange-600">
              {Math.round(competencies.reduce((sum, c) => sum + c.progress, 0) / competencies.length)}%
            </p>
          </Card>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeCategory === category
                  ? 'bg-brand-orange-600 text-white'
                  : 'bg-white text-black border hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredCompetencies.map((competency) => (
            <Card key={competency.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{competency.name}</h3>
                    <span className={`px-3 py-2 rounded text-xs font-medium ${levelColors[competency.level]}`}>
                      {competency.level}
                    </span>
                    <span className={`px-3 py-2 rounded text-xs font-medium ${statusColors[competency.status]}`}>
                      {competency.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-black">{competency.category}</p>
                  <p className="text-sm text-gray-500">
                    {competency.assessments} assessments • Last assessed: {competency.lastAssessed}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-brand-orange-600">{competency.progress}%</div>
                  <p className="text-sm text-black">Progress</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="   h-3 rounded-full transition-all"
                    style={{ width: `${competency.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm">Take Assessment</Button>
                <Button size="sm" variant="secondary">View Details</Button>
                <Button size="sm" variant="secondary">Learning Resources</Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 mt-8   ">
          <h3 className="text-xl font-bold mb-4">Competency Framework</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-semibold text-brand-blue-700 mb-2">Beginner</h4>
              <p className="text-sm text-black">Basic understanding and awareness</p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">Intermediate</h4>
              <p className="text-sm text-black">Can apply with guidance</p>
            </div>
            <div>
              <h4 className="font-semibold text-brand-orange-700 mb-2">Advanced</h4>
              <p className="text-sm text-black">Independent application</p>
            </div>
            <div>
              <h4 className="font-semibold text-brand-red-700 mb-2">Expert</h4>
              <p className="text-sm text-black">Can teach and mentor others</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
