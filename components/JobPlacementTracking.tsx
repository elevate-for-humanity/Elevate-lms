"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Placement {
  id: string;
  studentName: string;
  program: string;
  employer: string;
  position: string;
  salary: number;
  startDate: string;
  status: 'placed' | 'interviewing' | 'offer-pending';
  matchScore: number;
}

export function JobPlacementTracking() {
  const [activeTab, setActiveTab] = useState<'overview' | 'placements' | 'pipeline'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const placements: Placement[] = [
    {
      id: '1',
      studentName: 'Jordan Martinez',
      program: 'Full-Stack Web Development',
      employer: 'Tech Solutions Inc',
      position: 'Junior Developer',
      salary: 75000,
      startDate: '2024-02-01',
      status: 'placed',
      matchScore: 95,
    },
    {
      id: '2',
      studentName: 'Taylor Anderson',
      program: 'Certified Nursing Assistant',
      employer: 'Healthcare Plus',
      position: 'CNA',
      salary: 42000,
      startDate: '2024-02-15',
      status: 'placed',
      matchScore: 92,
    },
    {
      id: '3',
      studentName: 'Alex Kim',
      program: 'HVAC Technician',
      employer: 'Climate Control Systems',
      position: 'HVAC Technician',
      salary: 55000,
      startDate: '2024-03-01',
      status: 'offer-pending',
      matchScore: 88,
    },
    {
      id: '4',
      studentName: 'Sam Rivera',
      program: 'Full-Stack Web Development',
      employer: 'Digital Innovations',
      position: 'Frontend Developer',
      salary: 70000,
      startDate: '2024-02-20',
      status: 'interviewing',
      matchScore: 90,
    },
  ];

  const metrics = {
    totalPlacements: placements.filter(p => p.status === 'placed').length,
    placementRate: 87,
    avgSalary: Math.round(placements.reduce((sum, p) => sum + p.salary, 0) / placements.length),
    avgTimeToPlacement: 45,
  };

  const filteredPlacements = filterStatus === 'all'
    ? placements
    : placements.filter(p => p.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Job Placement Tracking</h1>
          <p className="text-red-100">Monitor student success and employment outcomes</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white border-b mb-8 rounded-lg">
          <div className="flex gap-8 px-6">
            {(['overview', 'placements', 'pipeline'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium capitalize ${
                  activeTab === tab ? 'border-red-600 text-brand-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <h3 className="text-sm text-black mb-2">Total Placements</h3>
                <p className="text-3xl font-bold text-brand-blue-600">{metrics.totalPlacements}</p>
                <p className="text-sm text-green-600">↑ 12% from last quarter</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm text-black mb-2">Placement Rate</h3>
                <p className="text-3xl font-bold text-green-600">{metrics.placementRate}%</p>
                <p className="text-sm text-black">Within 90 days</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm text-black mb-2">Avg Starting Salary</h3>
                <p className="text-3xl font-bold text-orange-500">${(metrics.avgSalary / 1000).toFixed(0)}k</p>
                <p className="text-sm text-green-600">↑ 8% from last year</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm text-black mb-2">Avg Time to Placement</h3>
                <p className="text-3xl font-bold text-blue-600">{metrics.avgTimeToPlacement} days</p>
                <p className="text-sm text-green-600">↓ 15% improvement</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Placements by Program</h3>
                <div className="space-y-4">
                  {[
                    { program: 'Full-Stack Web Development', count: 15, percentage: 35 },
                    { program: 'Certified Nursing Assistant', count: 12, percentage: 28 },
                    { program: 'HVAC Technician', count: 10, percentage: 23 },
                    { program: 'Commercial Truck Driving', count: 6, percentage: 14 },
                  ].map((item) => (
                    <div key={item.program}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{item.program}</span>
                        <span className="text-black">{item.count} placements</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="   h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Top Hiring Partners</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Tech Solutions Inc', hires: 8, logo: '💻' },
                    { name: 'Healthcare Plus', hires: 6, logo: '🏥' },
                    { name: 'Climate Control Systems', hires: 5, logo: '🔧' },
                    { name: 'Digital Innovations', hires: 4, logo: '🚀' },
                  ].map((partner) => (
                    <div key={partner.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{partner.logo}</div>
                        <span className="font-medium">{partner.name}</span>
                      </div>
                      <span className="px-3 py-2 bg-orange-100 text-orange-700 text-sm rounded">
                        {partner.hires} hires
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-6   ">
              <h3 className="text-xl font-bold mb-4">Success Stories</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="text-sm text-black">
                    <strong>Jordan Martinez</strong> secured a $75k position at Tech Solutions Inc within 30 days of graduation
                  </p>
                </div>
                <div className="p-4 bg-white rounded">
                  <p className="text-3xl mb-2">🏆</p>
                  <p className="text-sm text-black">
                    <strong>Taylor Anderson</strong> received multiple offers and chose Healthcare Plus for career growth
                  </p>
                </div>
                <div className="p-4 bg-white rounded">
                  <p className="text-3xl mb-2">⭐</p>
                  <p className="text-sm text-black">
                    <strong>Alex Kim</strong> matched with Climate Control Systems with a 95% compatibility score
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'placements' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">All Placements</h2>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border rounded"
                >
                  <option value="all">All Status</option>
                  <option value="placed">Placed</option>
                  <option value="offer-pending">Offer Pending</option>
                  <option value="interviewing">Interviewing</option>
                </select>
                <Button variant="secondary">Export Report</Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredPlacements.map((placement) => (
                <Card key={placement.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{placement.studentName}</h3>
                        <span className={`px-3 py-2 rounded text-xs font-medium ${
                          placement.status === 'placed' ? 'bg-green-100 text-green-700' :
                          placement.status === 'offer-pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {placement.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-black mb-1">{placement.program}</p>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-black">Employer:</p>
                          <p className="font-semibold">{placement.employer}</p>
                        </div>
                        <div>
                          <p className="text-black">Position:</p>
                          <p className="font-semibold">{placement.position}</p>
                        </div>
                        <div>
                          <p className="text-black">Salary:</p>
                          <p className="font-semibold text-green-600">
                            ${placement.salary.toLocaleString()}/year
                          </p>
                        </div>
                        <div>
                          <p className="text-black">Start Date:</p>
                          <p className="font-semibold">{placement.startDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-3xl font-bold text-brand-blue-600">{placement.matchScore}%</div>
                      <p className="text-sm text-black">Match Score</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Placement Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { stage: 'Job Ready', count: 24, color: 'blue' },
                { stage: 'Interviewing', count: 12, color: 'brand-red' },
                { stage: 'Offer Pending', count: 8, color: 'yellow' },
                { stage: 'Placed', count: 43, color: 'green' },
              ].map((stage) => (
                <Card key={stage.stage} className="p-6">
                  <h3 className="text-lg font-bold mb-4">{stage.stage}</h3>
                  <p className={`text-4xl font-bold mb-2 text-${stage.color}-600`}>
                    {stage.count}
                  </p>
                  <p className="text-sm text-black">students</p>
                  <Button size="sm" variant="secondary" className="w-full mt-4">
                    View Details
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
