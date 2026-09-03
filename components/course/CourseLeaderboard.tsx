'use client';
import { logger } from '@/lib/logger';

import React from 'react';

import { useEffect, useState } from 'react';

type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  progress: number;
};

export function CourseLeaderboard({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/courses/${courseId}/leaderboard`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setRows(json.leaderboard || []);
      } catch (e) {
        logger.error('Error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-slate-500 shadow-sm">
        Loading leaderboard…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-slate-500 shadow-sm">
        Leaderboard will appear once students start progressing.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-3">Leaderboard</h3>
      <div className="space-y-2 text-xs">
        {rows.map((row) => (
          <div
            key={row.userId}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-black">#{row.rank}</span>
              <span className="font-medium text-black">{row.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-orange-600">
                {Math.round(row.progress)}%
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-orange-500"
                  style={{ width: `${Math.min(row.progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
