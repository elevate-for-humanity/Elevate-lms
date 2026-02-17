"use client";

import React from 'react';

import { useEffect, useState } from "react";

type GlobalRow = {
  rank: number;
  userId: string;
  name: string;
  avgProgress: number;
  isYou: boolean;
};

export function GlobalLeaderboard() {
  const [rows, setRows] = useState<GlobalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/leaderboard/global");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setRows(json.leaderboard || []);
      } catch (e) {
        // Error: $1
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 text-xs text-slate-500 shadow-sm">
        Loading global leaderboard…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border bg-white p-4 text-xs text-slate-500 shadow-sm">
        Once learners start progressing, you'll see the top performers here.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-2">Top Learners (All Programs)</h3>
      <p className="mb-3 text-[11px] text-slate-500">
        Ranked by average course progress across all enrolled programs.
      </p>
      <div className="space-y-1.5 text-xs">
        {rows.map((row) => (
          <div
            key={row.userId}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
              row.isYou ? "bg-brand-orange-50" : "bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-black">
                #{row.rank}
              </span>
              <span
                className={`font-medium ${
                  row.isYou ? "text-brand-orange-700" : "text-black"
                }`}
              >
                {row.isYou ? "You" : row.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-orange-600">
                {Math.round(row.avgProgress)}%
              </span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-orange-500"
                  style={{ width: `${Math.min(row.avgProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
