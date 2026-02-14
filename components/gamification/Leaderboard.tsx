"use client";

import { Trophy, TrendingUp, Award } from 'lucide-react';

const leaderboardData = [
  {
    rank: 1,
    name: 'Sarah Martinez',
    points: 2850,
    courses: 3,
    avatar: 'SM',
    color: 'bg-yellow-500',
  },
  {
    rank: 2,
    name: 'Graduate',
    points: 2640,
    courses: 2,
    avatar: 'MJ',
    color: 'bg-gray-400',
  },
  {
    rank: 3,
    name: 'David Williams',
    points: 2420,
    courses: 2,
    avatar: 'DW',
    color: 'bg-amber-600',
  },
  {
    rank: 4,
    name: 'You',
    points: 2180,
    courses: 2,
    avatar: 'J',
    color: 'bg-emerald-500',
    isCurrentUser: true,
  },
  {
    rank: 5,
    name: 'Lisa Chen',
    points: 1950,
    courses: 1,
    avatar: 'LC',
    color: 'bg-brand-blue-500',
  },
];

export function Leaderboard() {
  return (
    <div className="elevate-card">
      <div className="elevate-card-header">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-orange-600" />
          <h3 className="elevate-card-title">Leaderboard</h3>
        </div>
        <span className="elevate-pill elevate-pill--orange">This Month</span>
      </div>
      <div className="space-y-2">
        {leaderboardData.map((user) => (
          <div
            key={user.rank}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
              user.isCurrentUser
                ? 'bg-brand-blue-50 border-2 border-orange-500'
                : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-8 text-center">
              {user.rank <= 3 ? (
                <div
                  className={`w-8 h-8 rounded-full  ${user.color} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {user.rank}
                </div>
              ) : (
                <div className="text-lg font-bold text-gray-400">
                  {user.rank}
                </div>
              )}
            </div>
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-full  ${user.color} flex items-center justify-center text-white font-bold flex-shrink-0`}
            >
              {user.avatar}
            </div>
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold text-sm ${user.isCurrentUser ? 'text-brand-blue-900' : 'text-black'}`}
              >
                {user.name}
              </p>
              <p className="text-xs text-gray-500">
                {user.courses} courses completed
              </p>
            </div>
            {/* Points */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-orange-600 font-bold">
                <Award className="h-4 w-4" />
                {(user.points || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-black">Your Progress</span>
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <TrendingUp className="h-4 w-4" />
            +230 pts this week
          </div>
        </div>
      </div>
    </div>
  );
}
