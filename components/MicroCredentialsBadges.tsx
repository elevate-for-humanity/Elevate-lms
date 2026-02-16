"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  earnedDate?: string;
  progress?: number;
  requirements: string[];
  issuer: string;
  verificationUrl?: string;
}

export default function MicroCredentialsBadges() {
  const [activeTab, setActiveTab] = useState<'earned' | 'available' | 'in-progress'>('earned');

  const badges: Badge[] = [
    {
      id: '1',
      name: 'JavaScript Master',
      icon: '🏆',
      description: 'Demonstrated advanced proficiency in JavaScript programming',
      category: 'Technical',
      earnedDate: '2024-01-15',
      issuer: 'Elevate for Humanity',
      verificationUrl: 'https://verify.elevateforhumanity.com/badge/js-master-001',
      requirements: [
        'Complete JavaScript Advanced course',
        'Score 90%+ on final assessment',
        'Build 3 JavaScript projects',
      ],
    },
    {
      id: '2',
      name: 'React Developer',
      icon: '⚛️',
      description: 'Proficient in building modern React applications',
      category: 'Technical',
      earnedDate: '2024-01-10',
      issuer: 'Elevate for Humanity',
      verificationUrl: 'https://verify.elevateforhumanity.com/badge/react-dev-002',
      requirements: [
        'Complete React Fundamentals',
        'Build component library',
        'Deploy production app',
      ],
    },
    {
      id: '3',
      name: 'Team Leader',
      icon: '👥',
      description: 'Demonstrated leadership and team collaboration skills',
      category: 'Soft Skills',
      earnedDate: '2024-01-20',
      issuer: 'Elevate for Humanity',
      verificationUrl: 'https://verify.elevateforhumanity.com/badge/team-leader-003',
      requirements: [
        'Lead 2+ team projects',
        'Complete leadership training',
        'Peer evaluations 4.5+/5',
      ],
    },
    {
      id: '4',
      name: 'Database Expert',
      icon: '🗄️',
      description: 'Advanced database design and optimization skills',
      category: 'Technical',
      progress: 65,
      issuer: 'Elevate for Humanity',
      requirements: [
        'Complete Database Design course',
        'Optimize query performance',
        'Design normalized schema',
      ],
    },
    {
      id: '5',
      name: 'Problem Solver',
      icon: '🧩',
      description: 'Exceptional analytical and problem-solving abilities',
      category: 'Soft Skills',
      progress: 80,
      issuer: 'Elevate for Humanity',
      requirements: [
        'Solve 50+ coding challenges',
        'Complete critical thinking course',
        'Case study presentation',
      ],
    },
    {
      id: '6',
      name: 'Full-Stack Developer',
      icon: '💻',
      description: 'Comprehensive full-stack development expertise',
      category: 'Technical',
      progress: 45,
      issuer: 'Elevate for Humanity',
      requirements: [
        'Complete frontend specialization',
        'Complete backend specialization',
        'Build full-stack application',
        'Deploy to production',
      ],
    },
  ];

  const earnedBadges = badges.filter(b => b.earnedDate);
  const inProgressBadges = badges.filter(b => b.progress && !b.earnedDate);
  const availableBadges = badges.filter(b => !b.progress && !b.earnedDate);

  const displayBadges =
    activeTab === 'earned' ? earnedBadges :
    activeTab === 'in-progress' ? inProgressBadges :
    availableBadges;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Micro-Credentials & Digital Badges</h1>
          <p className="text-red-100">Showcase your verified skills and achievements</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-4xl mb-2 text-2xl md:text-3xl lg:text-4xl">🏆</div>
            <p className="text-3xl font-bold text-brand-orange-600">{earnedBadges.length}</p>
            <p className="text-black">Badges Earned</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl mb-2 text-2xl md:text-3xl lg:text-4xl">⏳</div>
            <p className="text-3xl font-bold text-orange-500">{inProgressBadges.length}</p>
            <p className="text-black">In Progress</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl mb-2 text-2xl md:text-3xl lg:text-4xl">🎯</div>
            <p className="text-3xl font-bold text-brand-blue-600">{availableBadges.length}</p>
            <p className="text-black">Available</p>
          </Card>
        </div>

        <div className="bg-white border-b mb-8 rounded-lg">
          <div className="flex gap-8 px-6">
            {(['earned', 'in-progress', 'available'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium ${
                  activeTab === tab ? 'border-red-600 text-brand-orange-600' : 'border-transparent text-gray-500'
                }`}
              >
                {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBadges.map((badge) => (
            <Card key={badge.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-4">
                <div className={`text-6xl mb-3 ${badge.earnedDate ? '' : 'opacity-40'}`}>
                  {badge.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{badge.name}</h3>
                <span className="px-3 py-2 bg-orange-100 text-orange-700 text-xs rounded">
                  {badge.category}
                </span>
              </div>

              <p className="text-black text-sm mb-4 text-center">{badge.description}</p>

              {badge.progress !== undefined && !badge.earnedDate && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-black">Progress</span>
                    <span className="font-semibold text-brand-orange-600">{badge.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="   h-2 rounded-full"
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-semibold text-black mb-2">Requirements:</p>
                <ul className="space-y-1">
                  {badge.requirements.map((req, idx) => (
                    <li key={idx} className="text-xs text-black flex items-start">
                      <span className={`mr-2 ${badge.earnedDate ? 'text-green-500' : 'text-gray-400'}`}>
                        {badge.earnedDate ? '•' : '○'}
                      </span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {badge.earnedDate && (
                <div className="mb-4 p-3 bg-green-50 rounded">
                  <p className="text-sm text-green-700 font-semibold">
                    • Earned on {new Date(badge.earnedDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Issued by {badge.issuer}</p>
                </div>
              )}

              <div className="space-y-2">
                {badge.earnedDate ? (
                  <>
                    <Button className="w-full" size="sm">Share on LinkedIn</Button>
                    <Button variant="secondary" className="w-full" size="sm">
                      Download Certificate
                    </Button>
                    {badge.verificationUrl && (
                      <a
                        href={badge.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-sm text-brand-blue-600 hover:underline"
                      >
                        Verify Badge
                      </a>
                    )}
                  </>
                ) : (
                  <Button className="w-full" size="sm">View Requirements</Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 mt-8   ">
          <h3 className="text-xl font-bold mb-4">About Digital Badges</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-red-700 mb-2">🔒 Verified</h4>
              <p className="text-sm text-black">
                All badges are blockchain-verified and tamper-proof
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-orange-700 mb-2">🌐 Shareable</h4>
              <p className="text-sm text-black">
                Share on LinkedIn, resume, or portfolio with verification links
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-red-700 mb-2">📊 Stackable</h4>
              <p className="text-sm text-black">
                Combine badges to earn advanced credentials and certifications
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
