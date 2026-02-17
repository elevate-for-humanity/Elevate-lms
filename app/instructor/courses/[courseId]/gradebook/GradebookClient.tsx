"use client";

import React from 'react';

import { useState } from "react";

type Student = {
  enrollmentId: string;
  userId: string;
  name: string;
  email: string;
};

type GradeItem = {
  id: string;
  title: string;
  category: string;
  maxPoints: number;
  grades: { enrollmentId: string; points: number }[];
};

type Props = {
  initialData: {
    course: { id: string; title: string };
    students: Student[];
    gradeItems: GradeItem[];
  };
};

export default function GradebookClient({ initialData }: Props) {
  const [gradeItems, setGradeItems] = useState(initialData.gradeItems);
  const [saving, setSaving] = useState(false);

  function getGradeValue(gi: GradeItem, enrollmentId: string): string {
    const g = gi.grades.find((x) => x.enrollmentId === enrollmentId);
    return g ? String(g.points) : "";
  }

  async function handleChange(
    gradeItemId: string,
    enrollmentId: string,
    value: string
  ) {
    const points = value === "" ? null : Number(value);
    if (value !== "" && Number.isNaN(points)) return;

    // Update local state optimistically
    setGradeItems((prev) =>
      prev.map((gi) => {
        if (gi.id !== gradeItemId) return gi;
        const existing = gi.grades.find(
          (g) => g.enrollmentId === enrollmentId
        );
        if (!existing) {
          return {
            ...gi,
            grades:
              points === null
                ? gi.grades
                : [...gi.grades, { enrollmentId, points }],
          };
        }
        return {
          ...gi,
          grades:
            points === null
              ? gi.grades.filter((g) => g.enrollmentId !== enrollmentId)
              : gi.grades.map((g) =>
                  g.enrollmentId === enrollmentId ? { ...g, points } : g
                ),
        };
      })
    );

    if (points === null) return; // Don't save empty grades

    setSaving(true);
    try {
      await fetch("/api/grade/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeItemId, enrollmentId, points }),
      });
    } catch (error) { /* Error handled silently */ 
    // Error handled
  } finally {
      setSaving(false);
    }
  }

  const { students } = initialData;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black">
              Gradebook – {initialData.course.title}
            </h1>
            <p className="mt-2 text-sm text-black">
              Click a cell to enter or update grades. Changes save
              automatically.
            </p>
          </div>
          {saving && (
            <span className="rounded-full bg-brand-red-50 px-3 py-2 text-[11px] font-semibold text-brand-red-700">
              Saving…
            </span>
          )}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left text-[11px] font-medium text-slate-500">
                  Student
                </th>
                {gradeItems.map((gi) => (
                  <th
                    key={gi.id}
                    className="px-3 py-2 text-left text-[11px] font-medium text-slate-500"
                  >
                    <div className="flex flex-col">
                      <span>{gi.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {gi.category} • {gi.maxPoints} pts
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                // Calculate total
                const total = gradeItems.reduce((sum, gi) => {
                  const g = gi.grades.find(
                    (x) => x.enrollmentId === s.enrollmentId
                  );
                  return sum + (g?.points ?? 0);
                }, 0);
                const maxTotal = gradeItems.reduce(
                  (sum, gi) => sum + gi.maxPoints,
                  0
                );
                const percentage =
                  maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : "0.0";

                return (
                  <tr
                    key={s.enrollmentId}
                    className="border-t border-slate-100"
                  >
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 text-black">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {s.email}
                      </div>
                    </td>
                    {gradeItems.map((gi) => (
                      <td key={gi.id} className="px-3 py-2 align-middle">
                        <input
                          className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-right text-xs focus:border-brand-orange-500 focus:outline-none"
                          defaultValue={getGradeValue(gi, s.enrollmentId)}
                          onBlur={(e) =>
                            handleChange(
                              gi.id,
                              s.enrollmentId,
                              e.target.value.trim()
                            )
                          }
                          placeholder="–"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-semibold text-black">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={gradeItems.length + 2}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No enrollments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
