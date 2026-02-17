"use client";

import { Flame, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StreakTrackerProps {
  userId?: string;
  currentStreak?: number;
  longestStreak?: number;
  totalActiveDays?: number;
  lastActivityDate?: string;
  recentDays?: Array<{
    date: string;
    active: boolean;
  }>;
}

export function StreakTracker({
  userId,
  currentStreak: initialStreak,
  longestStreak: initialLongest,
  totalActiveDays: initialDays,
  lastActivityDate: initialLastActivity,
  recentDays: initialRecentDays = [],
}: StreakTrackerProps) {
  const [currentStreak, setCurrentStreak] = useState(initialStreak || 0);
  const [longestStreak, setLongestStreak] = useState(initialLongest || 0);
  const [totalActiveDays, setTotalActiveDays] = useState(initialDays || 0);
  const [lastActivityDate, setLastActivityDate] = useState(initialLastActivity || new Date().toISOString());
  const [recentDays, setRecentDays] = useState(initialRecentDays);
  const [loading, setLoading] = useState(!initialStreak && initialStreak !== 0);

  useEffect(() => {
    if (initialStreak !== undefined || !userId) return;

    async function fetchStreak() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('user_streaks')
          .select('current_streak, longest_streak, total_active_days, last_activity_date')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          setCurrentStreak(data.current_streak || 0);
          setLongestStreak(data.longest_streak || 0);
          setTotalActiveDays(data.total_active_days || 0);
          setLastActivityDate(data.last_activity_date || new Date().toISOString());
        }
      } catch (error) {
        console.error('Failed to fetch streak:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStreak();
  }, [userId, initialStreak]);

  if (loading) {
    return (
      <div className="rounded-lg p-6 bg-gray-100 animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }
  const isStreakActive = () => {
    const lastActivity = new Date(lastActivityDate);
    const today = new Date();
    const diffDays = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 1;
  };

  const streakActive = isStreakActive();

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-full ${streakActive ? "bg-brand-orange-500" : "bg-slate-700"}`}>
          <Flame className={`w-6 h-6 ${streakActive ? "text-white" : "text-slate-500"}`} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">{currentStreak} Days</h3>
          <p className="text-sm text-slate-400">Current Streak</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{longestStreak}</p>
          <p className="text-xs text-slate-400">Longest Streak</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{totalActiveDays}</p>
          <p className="text-xs text-slate-400">Total Active Days</p>
        </div>
      </div>

      {/* Calendar View */}
      {recentDays.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Last 7 Days
          </h4>
          <div className="flex gap-2">
            {recentDays.map((day, index) => (
              <div
                key={index}
                className={`flex-1 h-12 rounded-lg flex items-center justify-center ${
                  day.active
                    ? "bg-brand-orange-500 text-white"
                    : "bg-slate-900 text-black"
                }`}
              >
                <span className="text-xs font-semibold">
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivation Message */}
      <div className="mt-6 p-4 bg-brand-orange-500/10 border border-brand-orange-500/20 rounded-lg">
        <p className="text-sm text-brand-orange-400">
          {streakActive
            ? currentStreak >= 7
              ? "🔥 Amazing! Keep the momentum going!"
              : "Great start! Keep learning daily to build your streak."
            : "Your streak ended. Start learning today to begin a new one!"}
        </p>
      </div>
    </div>
  );
}
