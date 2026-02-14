"use client";

import { Award, Star, Trophy, Target, Zap, Crown } from 'lucide-react';

const badges = [
  {
    id: 1,
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: Star,
    color: 'bg-yellow-500',
    earned: true,
    earnedDate: '2024-11-01',
  },
  {
    id: 2,
    name: 'Quick Learner',
    description: 'Complete 5 lessons in one week',
    icon: Zap,
    color: 'bg-brand-blue-500',
    earned: true,
    earnedDate: '2024-11-05',
  },
  {
    id: 3,
    name: 'Course Master',
    description: 'Complete an entire course',
    icon: Trophy,
    color: 'bg-emerald-500',
    earned: true,
    earnedDate: '2024-11-10',
  },
  {
    id: 4,
    name: 'Perfect Score',
    description: 'Score 100% on a quiz',
    icon: Target,
    color: 'bg-purple-500',
    earned: false,
    earnedDate: null,
  },
  {
    id: 5,
    name: 'Dedication',
    description: 'Study for 7 days straight',
    icon: Award,
    color: 'bg-orange-500',
    earned: false,
    earnedDate: null,
  },
  {
    id: 6,
    name: 'Champion',
    description: 'Complete 3 courses',
    icon: Crown,
    color: 'bg-red-500',
    earned: false,
    earnedDate: null,
  },
];

export function AchievementBadges() {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="elevate-card">
      <div className="elevate-card-header">
        <div>
          <h3 className="elevate-card-title">Achievements</h3>
          <p className="elevate-card-subtitle">
            {earnedCount} of {badges.length} badges earned
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className={`relative p-4 rounded-lg border-2 text-center transition-all ${
                badge.earned
                  ? 'border-transparent  ' +
                    badge.color +
                    ' text-white shadow-lg hover:scale-105'
                  : 'border-gray-200 bg-gray-50 opacity-50'
              }`}
            >
              <div className="flex justify-center mb-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    badge.earned ? 'bg-white/20' : 'bg-gray-200'
                  }`}
                >
                  <Icon
                    className={`h-10 w-10 ${badge.earned ? 'text-white' : 'text-gray-400'}`}
                  />
                </div>
              </div>
              <h4
                className={`font-bold text-sm mb-1 ${badge.earned ? 'text-white' : 'text-black'}`}
              >
                {badge.name}
              </h4>
              <p
                className={`text-xs ${badge.earned ? 'text-white/90' : 'text-gray-500'}`}
              >
                {badge.description}
              </p>
              {badge.earned && badge.earnedDate && (
                <p className="text-xs text-white/70 mt-2">
                  Earned {new Date(badge.earnedDate).toLocaleDateString()}
                </p>
              )}
              {!badge.earned && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl text-2xl md:text-3xl lg:text-4xl">🔒</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-black">Next Achievement</span>
          <span className="elevate-pill elevate-pill--orange">
            2 lessons away
          </span>
        </div>
      </div>
    </div>
  );
}
