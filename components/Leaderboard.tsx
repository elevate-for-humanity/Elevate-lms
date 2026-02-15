"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  level: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  timeframe?: 'week' | 'month' | 'all-time';
}

export function Leaderboard({ entries, timeframe = 'week' }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Medal className="text-orange-600" size={24} />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-black border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-gray-50 text-black border-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Leaderboard</CardTitle>
          <Badge variant="outline">{timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : 'All Time'}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                entry.isCurrentUser
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:bg-gray-50'
              } transition`}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getRankBadge(entry.rank)}`}>
                {getRankIcon(entry.rank) || (
                  <span className="font-bold">{entry.rank}</span>
                )}
              </div>

              <Image
                src={entry.avatar}
                alt={entry.name}
                width={48}
                height={48}
                className="rounded-full"
              />

              <div className="flex-1">
                <div className="font-semibold">{entry.name}</div>
                <div className="text-sm text-black">Level {entry.level}</div>
              </div>

              <div className="text-right">
                <div className="font-bold text-brand-orange-600">{entry.points.toLocaleString()}</div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
