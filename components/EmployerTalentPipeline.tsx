"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Candidate {
  id: string;
  name: string;
  program: string;
  skills: string[];
  stage: 'sourced' | 'screening' | 'interview' | 'offer' | 'hired';
  matchScore: number;
  graduationDate: string;
}

export function EmployerTalentPipeline() {
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const candidates: Candidate[] = [
    {
      id: '1',
      name: 'Jordan Martinez',
      program: 'Full-Stack Web Development',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      stage: 'interview',
      matchScore: 95,
      graduationDate: '2024-03',
    },
    {
      id: '2',
      name: 'Taylor Anderson',
      program: 'Certified Nursing Assistant',
      skills: ['Patient Care', 'Vital Signs', 'Medical Records'],
      stage: 'screening',
      matchScore: 88,
      graduationDate: '2024-02',
    },
    {
      id: '3',
      name: 'Alex Kim',
      program: 'HVAC Technician',
      skills: ['HVAC Systems', 'Troubleshooting', 'EPA Certified'],
      stage: 'offer',
      matchScore: 92,
      graduationDate: '2024-01',
    },
  ];

  const stages = ['all', 'sourced', 'screening', 'interview', 'offer', 'hired'];
  const filteredCandidates = selectedStage === 'all'
    ? candidates
    : candidates.filter(c => c.stage === selectedStage);

  const stageColors: Record<string, string> = {
    sourced: 'bg-gray-100 text-black',
    screening: 'bg-brand-blue-100 text-brand-blue-700',
    interview: 'bg-purple-100 text-purple-700',
    offer: 'bg-orange-100 text-orange-700',
    hired: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Talent Pipeline</h1>
          <p className="text-red-100">Manage your candidate pipeline</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {stages.slice(1).map((stage) => (
            <Card key={stage} className="p-4 text-center">
              <p className="text-2xl font-bold text-brand-orange-600">
                {candidates.filter(c => c.stage === stage).length}
              </p>
              <p className="text-sm text-black capitalize">{stage}</p>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                selectedStage === stage
                  ? 'bg-brand-orange-600 text-white'
                  : 'bg-white text-black border hover:bg-gray-50'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{candidate.name}</h3>
                    <span className={`px-3 py-2 rounded text-xs font-medium ${stageColors[candidate.stage]}`}>
                      {candidate.stage}
                    </span>
                  </div>
                  <p className="text-black">{candidate.program}</p>
                  <p className="text-sm text-gray-500">Graduates: {candidate.graduationDate}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-brand-orange-600">{candidate.matchScore}%</div>
                  <p className="text-sm text-black">Match Score</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-black mb-2">Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <span key={skill} className="px-3 py-2 bg-orange-100 text-orange-700 text-sm rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm">View Profile</Button>
                <Button size="sm" variant="secondary">Schedule Interview</Button>
                <Button size="sm" variant="secondary">Send Message</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
