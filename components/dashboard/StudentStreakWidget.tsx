"use client";

import React from 'react';

import { useEffect, useState } from "react";

type StreakData = {
  minutesToday: number;
  dailyMinutes: number;
  currentStreak: number;
  longestStreak: number;
};

export function StudentStreakWidget() {
  const [data, setData] = useState<StreakData | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/student/streak", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
        setGoalInput(String(json.dailyMinutes ?? 20));
      } catch (e) {
        // Error: $1
      }
    }
    load();
  }, []);

  const saveGoal = async () => {
    const minutes = parseInt(goalInput, 10);
    if (Number.isNaN(minutes) || minutes <= 0) return;

    const res = await fetch("/api/student/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyMinutes: minutes }),
    });
    const json = await res.json();
    setData((prev) =>
      prev
        ? { ...prev, dailyMinutes: json.dailyMinutes }
        : {
            minutesToday: 0,
            dailyMinutes: json.dailyMinutes,
            currentStreak: 0,
            longestStreak: 0,
          }
    );
    setEditingGoal(false);
  };

  if (!data) {
    return (
      <div className="rounded-xl border bg-white p-4 text-xs text-slate-500 shadow-sm">
        Loading your streak…
      </div>
    );
  }

  const { minutesToday, dailyMinutes, currentStreak, longestStreak } = data;
  const pct =
    dailyMinutes > 0
      ? Math.min(100, Math.round((minutesToday / dailyMinutes) * 100))
      : 0;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Daily Goal & Streak
          </p>
          <p className="text-sm font-bold text-black">
            {minutesToday} / {dailyMinutes} min today
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-black">
            🔥 Streak:{" "}
            <span className="font-semibold">{currentStreak} days</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Best: <span className="font-semibold">{longestStreak}</span> days
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-orange-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-black">
          Hit your daily minutes to keep your streak alive.
        </p>
        {!editingGoal ? (
          <button
            type="button"
            onClick={() => setEditingGoal(true)}
            className="rounded-full border px-3 py-2 text-[11px] font-semibold hover:bg-slate-50"
          >
            Edit goal
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              value={goalInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setGoalInput(e.target.value)}
              className="w-14 rounded border px-2 py-2 text-[11px]"
            />
            <span className="text-[11px] text-slate-500">min/day</span>
            <button
              type="button"
              onClick={saveGoal}
              className="rounded-full bg-brand-blue-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-brand-blue-700"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
