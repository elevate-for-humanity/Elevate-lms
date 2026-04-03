"use client";

import { Trophy, TrendingUp, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PointsDisplayProps {
  userId: string;
  totalPoints?: number;
  level?: number;
  levelName?: string;
  pointsToNextLevel?: number;
  recentTransactions?: Array<{
    points: number;
    description: string;
    created_at: string;
  }>;
}

export function PointsDisplay({
  userId,
  totalPoints: initialPoints,
  level: initialLevel,
  levelName: initialLevelName,
  pointsToNextLevel: initialPointsToNext,
  recentTransactions: initialTransactions = [],
}: PointsDisplayProps) {
  const [totalPoints, setTotalPoints] = useState(initialPoints || 0);
  const [level, setLevel] = useState(initialLevel || 1);
  const [levelName, setLevelName] = useState(initialLevelName || "Beginner");
  const [pointsToNextLevel, setPointsToNextLevel] = useState(initialPointsToNext || 1000);
  const [recentTransactions, setRecentTransactions] = useState(initialTransactions);
  const [loading, setLoading] = useState(!initialPoints);

  useEffect(() => {
    if (initialPoints !== undefined) return; // Already have data

    async function fetchPoints() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('gamification_points')
          .select('total_points, level, level_name, points_to_next_level')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          setTotalPoints(data.total_points || 0);
          setLevel(data.level || 1);
          setLevelName(data.level_name || "Beginner");
          setPointsToNextLevel(data.points_to_next_level || 1000);
        }
      } catch (error) {
        console.error('Failed to fetch points:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, [userId, initialPoints]);

  if (loading) {
    return (
      <div className="rounded-lg p-6 bg-gray-100 animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }

  const progressPercentage = ((totalPoints % 1000) / 1000) * 100;

  return (
    <div className="   rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6" />
            <span className="text-2xl font-bold">{totalPoints.toLocaleString('en-US')}</span>
          </div>
          <p className="text-white text-sm">Total Points</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <Star className="w-5 h-5" />
            <span className="text-xl font-bold">Level {level}</span>
          </div>
          <p className="text-white text-sm">{levelName}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white">Progress to Level {level + 1}</span>
          <span className="font-semibold">{pointsToNextLevel} points to go</span>
        </div>
        <div className="w-full bg-white rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      {recentTransactions.length > 0 && (
        <div className="border-t border-brand-orange-400 pt-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Recent Activity
          </h4>
          <div className="space-y-2">
            {recentTransactions.slice(0, 3).map((transaction, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-white">{transaction.description}</span>
                <span className="font-semibold">+{transaction.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
