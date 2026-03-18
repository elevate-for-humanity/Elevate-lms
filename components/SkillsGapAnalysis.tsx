"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SkillGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'high' | 'medium' | 'low';
  trainingOptions: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: { name: string; level: number }[];
}

export default function SkillsGapAnalysis() {
  const [selectedRole, setSelectedRole] = useState('full-stack-developer');

  const skillGaps: SkillGap[] = [
    {
      skill: 'TypeScript',
      currentLevel: 45,
      requiredLevel: 85,
      gap: 40,
      priority: 'high',
      trainingOptions: ['TypeScript Fundamentals', 'Advanced TypeScript Patterns'],
    },
    {
      skill: 'AWS',
      currentLevel: 30,
      requiredLevel: 75,
      gap: 45,
      priority: 'high',
      trainingOptions: ['AWS Cloud Practitioner', 'AWS Solutions Architect'],
    },
    {
      skill: 'Docker',
      currentLevel: 55,
      requiredLevel: 80,
      gap: 25,
      priority: 'medium',
      trainingOptions: ['Docker Essentials', 'Container Orchestration'],
    },
    {
      skill: 'GraphQL',
      currentLevel: 40,
      requiredLevel: 70,
      gap: 30,
      priority: 'medium',
      trainingOptions: ['GraphQL Basics', 'GraphQL API Design'],
    },
    {
      skill: 'Testing',
      currentLevel: 65,
      requiredLevel: 85,
      gap: 20,
      priority: 'low',
      trainingOptions: ['Advanced Testing Strategies', 'E2E Testing'],
    },
  ];

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Alex Chen',
      role: 'Senior Developer',
      skills: [
        { name: 'JavaScript', level: 90 },
        { name: 'React', level: 85 },
        { name: 'TypeScript', level: 60 },
        { name: 'AWS', level: 40 },
      ],
    },
    {
      id: '2',
      name: 'Sarah Williams',
      role: 'Mid-Level Developer',
      skills: [
        { name: 'JavaScript', level: 75 },
        { name: 'React', level: 70 },
        { name: 'TypeScript', level: 30 },
        { name: 'AWS', level: 25 },
      ],
    },
    {
      id: '3',
      name: 'Graduate',
      role: 'Junior Developer',
      skills: [
        { name: 'JavaScript', level: 60 },
        { name: 'React', level: 55 },
        { name: 'TypeScript', level: 45 },
        { name: 'AWS', level: 20 },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Skills Gap Analysis</h2>
          <p className="text-brand-red-100">Identify and close skill gaps in your workforce</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-8   ">
          <div className="flex items-start gap-4">
            <div className="text-5xl text-3xl md:text-4xl lg:text-5xl">📊</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Automated Skills Assessment</h3>
              <p className="text-black mb-3">
                Our AI analyzes your team's current skills against industry requirements and job descriptions
                to identify critical gaps and recommend targeted training.
              </p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-brand-green-600">•</span>
                  <span>Real-time analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-green-600">•</span>
                  <span>Personalized recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-green-600">•</span>
                  <span>Track progress</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Role: Full-Stack Developer</h2>
          <div className="flex gap-2">
            <Button variant="secondary">Run New Analysis</Button>
            <Button>Export Report</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Critical Gaps</h3>
            <p className="text-3xl font-bold text-brand-orange-600">
              {skillGaps.filter(g => g.priority === 'high').length}
            </p>
            <p className="text-sm text-black">Require immediate attention</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Average Gap</h3>
            <p className="text-3xl font-bold text-brand-orange-500">
              {Math.round(skillGaps.reduce((sum, g) => sum + g.gap, 0) / skillGaps.length)}%
            </p>
            <p className="text-sm text-black">Across all skills</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Training Needed</h3>
            <p className="text-3xl font-bold text-brand-blue-600">
              {skillGaps.reduce((sum, g) => sum + g.trainingOptions.length, 0)}
            </p>
            <p className="text-sm text-black">Courses recommended</p>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-6">Identified Skill Gaps</h3>
          <div className="space-y-6">
            {skillGaps.map((gap) => (
              <div key={gap.skill} className="border-b pb-6 last:border-b-0">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-bold">{gap.skill}</h4>
                    <span className={`inline-block mt-1 px-3 py-2 rounded text-xs font-medium ${
                      gap.priority === 'high' ? 'bg-brand-red-100 text-brand-red-700' :
                      gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-brand-blue-100 text-brand-blue-700'
                    }`}>
                      {gap.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-brand-orange-600">{gap.gap}%</div>
                    <p className="text-xs text-black">Gap</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-black">Current Level</span>
                    <span className="font-semibold">{gap.currentLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className="bg-brand-orange-500 h-3 rounded-full"
                      style={{ width: `${gap.currentLevel}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-black">Required Level</span>
                    <span className="font-semibold">{gap.requiredLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-white h-3 rounded-full"
                      style={{ width: `${gap.requiredLevel}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-black mb-2">Recommended Training:</p>
                  <div className="flex flex-wrap gap-2">
                    {gap.trainingOptions.map((option) => (
                      <button
                        key={option}
                        className="px-3 py-2 bg-brand-blue-100 text-brand-blue-700 text-sm rounded hover:bg-brand-blue-200 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-6">Team Skills Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Team Member</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">JavaScript</th>
                  <th className="text-left py-3 px-4">React</th>
                  <th className="text-left py-3 px-4">TypeScript</th>
                  <th className="text-left py-3 px-4">AWS</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{member.name}</td>
                    <td className="py-3 px-4 text-sm text-black">{member.role}</td>
                    {['JavaScript', 'React', 'TypeScript', 'AWS'].map((skillName) => {
                      const skill = member.skills.find(s => s.name === skillName);
                      const level = skill?.level || 0;
                      return (
                        <td key={skillName} className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  level >= 70 ? 'bg-brand-green-600' :
                                  level >= 50 ? 'bg-yellow-600' :
                                  'bg-brand-orange-600'
                                }`}
                                style={{ width: `${level}%` }}
                              />
                            </div>
                            <span className="text-sm">{level}%</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Action Plan</h3>
            <div className="space-y-3">
              <div className="p-4 bg-brand-red-50 rounded">
                <h4 className="font-semibold text-brand-red-900 mb-2">🔴 Immediate (1-2 months)</h4>
                <ul className="text-sm text-brand-red-700 space-y-1">
                  <li>• Enroll team in TypeScript Fundamentals</li>
                  <li>• Start AWS Cloud Practitioner certification</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 rounded">
                <h4 className="font-semibold text-yellow-900 mb-2">🟡 Short-term (3-6 months)</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Complete Docker training program</li>
                  <li>• Implement GraphQL in pilot project</li>
                </ul>
              </div>
              <div className="p-4 bg-brand-blue-50 rounded">
                <h4 className="font-semibold text-brand-blue-900 mb-2">🔵 Long-term (6-12 months)</h4>
                <ul className="text-sm text-brand-blue-700 space-y-1">
                  <li>• Advanced testing certification</li>
                  <li>• Continuous skill assessment</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">ROI Projection</h3>
            <div className="space-y-4">
              <div className="p-4 bg-brand-green-50 rounded">
                <h4 className="font-semibold text-brand-green-900 mb-2">Expected Benefits</h4>
                <ul className="text-sm text-brand-green-700 space-y-2">
                  <li className="flex justify-between">
                    <span>Productivity increase:</span>
                    <span className="font-bold">+25%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Project delivery time:</span>
                    <span className="font-bold">-30%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Code quality improvement:</span>
                    <span className="font-bold">+40%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Employee retention:</span>
                    <span className="font-bold">+15%</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-brand-blue-50 rounded">
                <h4 className="font-semibold text-brand-blue-900 mb-2">Investment Required</h4>
                <ul className="text-sm text-brand-blue-700 space-y-2">
                  <li className="flex justify-between">
                    <span>Training costs:</span>
                    <span className="font-bold">$12,000</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Time investment:</span>
                    <span className="font-bold">120 hours</span>
                  </li>
                  <li className="flex justify-between border-t border-brand-blue-200 pt-2 mt-2">
                    <span className="font-bold">ROI Timeline:</span>
                    <span className="font-bold">6 months</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
