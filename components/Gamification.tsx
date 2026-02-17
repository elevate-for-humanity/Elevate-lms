"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Zap } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  earned: boolean;
  progress?: number;
  total?: number;
}

interface GamificationProps {
  points: number;
  level: number;
  achievements: Achievement[];
  streak: number;
}

export function Gamification({ points, level, achievements, streak }: GamificationProps) {
  const nextLevelPoints = level * 1000;
  const progressToNextLevel = (points % 1000) / 10;

  return (
    <div className="space-y-6">
      {/* Points and Level */}
      <Card className="  ">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-brand-orange-600">{points}</div>
              <div className="text-sm text-black">Total Points</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-orange-600">Level {level}</div>
              <div className="text-sm text-black">{nextLevelPoints - points} to next level</div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full    transition-all"
              style={{ width: `${progressToNextLevel}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Streak */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-orange-100 rounded-lg">
              <Zap className="text-brand-orange-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{streak} Day Streak</div>
              <div className="text-sm text-black">Keep learning every day!</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`p-4 border-2 rounded-lg text-center ${
                    achievement.earned
                      ? 'border-brand-red-600 bg-brand-red-50'
                      : 'border-gray-200 bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <div className={`p-3 rounded-full ${achievement.earned ? 'bg-brand-orange-600' : 'bg-gray-400'}`}>
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                  <div className="font-semibold text-sm mb-1">{achievement.title}</div>
                  <div className="text-xs text-black">{achievement.description}</div>
                  {achievement.progress !== undefined && (
                    <div className="mt-2 text-xs text-gray-500">
                      {achievement.progress}/{achievement.total}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
