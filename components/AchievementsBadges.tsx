"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Award, Trophy, Star, Target, Zap, BookOpen, Clock, Users } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earned_at?: string;
  progress?: number;
  requirement?: number;
}

interface AchievementsBadgesProps {
  userId: string;
}

const iconMap: { [key: string]: any } = {
  award: Award,
  trophy: Trophy,
  star: Star,
  target: Target,
  zap: Zap,
  book: BookOpen,
  clock: Clock,
  users: Users,
};

export function AchievementsBadges({ userId }: AchievementsBadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [userId]);

  async function loadBadges() {
    try {
      const res = await fetch(`/api/users/${userId}/badges`);
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  }

  const filteredBadges = badges.filter(badge => {
    if (filter === 'earned') return badge.earned;
    if (filter === 'locked') return !badge.earned;
    return true;
  });

  const earnedCount = badges.filter(b => b.earned).length;
  const totalCount = badges.length;
  const completionPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-center text-slate-500">Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-black">Achievements & Badges</h3>
        <div className="text-right">
          <p className="text-3xl font-bold text-brand-orange-600">{earnedCount}/{totalCount}</p>
          <p className="text-sm text-black">Badges Earned</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-black">Overall Progress</span>
          <span className="text-sm text-black">{completionPercentage.toFixed(0)}%</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full    transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm rounded-lg transition ${
            filter === 'all'
              ? 'bg-brand-orange-600 text-white'
              : 'bg-slate-100 text-black hover:bg-slate-200'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setFilter('earned')}
          className={`px-4 py-2 text-sm rounded-lg transition ${
            filter === 'earned'
              ? 'bg-brand-orange-600 text-white'
              : 'bg-slate-100 text-black hover:bg-slate-200'
          }`}
        >
          Earned ({earnedCount})
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={`px-4 py-2 text-sm rounded-lg transition ${
            filter === 'locked'
              ? 'bg-brand-orange-600 text-white'
              : 'bg-slate-100 text-black hover:bg-slate-200'
          }`}
        >
          Locked ({totalCount - earnedCount})
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          const IconComponent = iconMap[badge.icon] || Award;
          const isEarned = badge.earned;

          return (
            <div
              key={badge.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isEarned
                  ? 'border-emerald-500 bg-brand-red-50 hover:shadow-lg'
                  : 'border-slate-200 bg-slate-50 opacity-60'
              }`}
            >
              {/* Badge Icon */}
              <div
                className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  isEarned
                    ? 'bg-emerald-500'
                    : 'bg-slate-300'
                }`}
              >
                <IconComponent className="w-8 h-8 text-white" />
              </div>

              {/* Badge Name */}
              <h4
                className={`text-center font-semibold mb-1 ${
                  isEarned ? 'text-black' : 'text-black'
                }`}
              >
                {badge.name}
              </h4>

              {/* Badge Description */}
              <p className="text-xs text-center text-black mb-2">
                {badge.description}
              </p>

              {/* Progress or Earned Date */}
              {isEarned ? (
                <div className="text-center">
                  <p className="text-xs text-brand-orange-600 font-medium">
                    Earned {new Date(badge.earned_at!).toLocaleDateString()}
                  </p>
                </div>
              ) : badge.progress !== undefined && badge.requirement !== undefined ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-black">Progress</span>
                    <span className="text-xs font-medium text-black">
                      {badge.progress}/{badge.requirement}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-orange-500"
                      style={{
                        width: `${(badge.progress / badge.requirement) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center text-slate-500">Locked</p>
              )}

              {/* Earned Badge Indicator */}
              {isEarned && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-black">
            {filter === 'earned'
              ? 'No badges earned yet. Keep learning!'
              : filter === 'locked'
              ? 'All badges unlocked! Great job!'
              : 'No badges available'}
          </p>
        </div>
      )}
    </div>
  );
}
