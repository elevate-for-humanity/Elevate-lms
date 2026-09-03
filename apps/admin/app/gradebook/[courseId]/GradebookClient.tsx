'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_GRADE_SCALE } from '@/lib/gradebook/types';
import { Users, FileText, ClipboardList, Download } from 'lucide-react';

const SpeedGrader = dynamic(() => import('@/components/gradebook/SpeedGrader'), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-slate-700">Loading grader...</div>,
});

/** Inline editable progress cell — calls /api/student/progress to override enrollment progress_percent. */
function ProgressCell({ enrollmentId, initialProgress }: { enrollmentId: string; initialProgress: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initialProgress));
  const [saved, setSaved] = useState(initialProgress);
  const [saving, setSaving] = useState(false);

  async function save() {
    const pct = Math.min(100, Math.max(0, parseInt(value, 10) || 0));
    setSaving(true);
    try {
      await fetch('/api/student/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, progress: pct }),
      });
      setSaved(pct);
      setValue(String(pct));
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-sm"
          autoFocus
        />
        <button onClick={save} disabled={saving} className="text-xs text-brand-blue-600 font-medium disabled:opacity-50">
          {saving ? '…' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-slate-400">✕</button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-2 group" title="Click to override progress">
      <div className="w-20 bg-slate-200 rounded-full h-1.5">
        <div className="bg-brand-blue-600 h-1.5 rounded-full" style={{ width: `${saved}%` }} />
      </div>
      <span className="text-sm text-slate-700 group-hover:underline">{saved}%</span>
    </button>
  );
}

interface Enrollment {
  id: string;
  user_id: string;
  progress: number;
  status: string;
  profiles: { full_name: string; email: string } | { full_name: string; email: string }[];
}

interface Submission {
  id: string;
  user_id: string;
  assignment_id: string;
  course_id: string;
  grade?: number;
  score?: number;
  status: string;
  submitted_at: string;
  content?: string;
}

interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  course_id: string;
  score: number;
  max_score: number;
  status: string;
  created_at: string;
}

interface GradebookClientProps {
  courseId: string;
  enrollments: Enrollment[];
  submissions: Submission[];
  quizAttempts: QuizAttempt[];
}

function getLetterGrade(pct: number): string {
  for (const [letter, min] of Object.entries(DEFAULT_GRADE_SCALE)) {
    if (pct >= min) return letter;
  }
  return 'F';
}

export function GradebookClient({
  courseId,
  enrollments,
  submissions,
  quizAttempts,
}: GradebookClientProps) {
  const [tab, setTab] = useState<'overview' | 'speedgrader'>('overview');
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  // Normalize profiles (Supabase !inner join can return object or array)
  function getProfile(e: Enrollment): { full_name: string; email: string } {
    if (Array.isArray(e.profiles)) return e.profiles[0] || { full_name: 'Student', email: '' };
    return e.profiles || { full_name: 'Student', email: '' };
  }

  // Group submissions by student
  const studentGrades = enrollments.map((enrollment) => {
    const studentSubs = submissions.filter((s) => s.user_id === enrollment.user_id);
    const studentQuizzes = quizAttempts.filter((q) => q.user_id === enrollment.user_id);

    const avgAssignment =
      studentSubs.length > 0
        ? studentSubs.reduce((sum, s) => sum + (s.grade || s.score || 0), 0) / studentSubs.length
        : null;

    const avgQuiz =
      studentQuizzes.length > 0
        ? studentQuizzes.reduce(
            (sum, q) => sum + (q.max_score > 0 ? (q.score / q.max_score) * 100 : 0),
            0,
          ) / studentQuizzes.length
        : null;

    const overall =
      avgAssignment !== null && avgQuiz !== null
        ? (avgAssignment + avgQuiz) / 2
        : (avgAssignment ?? avgQuiz ?? 0);

    return {
      ...enrollment,
      profile: getProfile(enrollment),
      assignmentAvg: avgAssignment,
      quizAvg: avgQuiz,
      overall: Math.round(overall * 10) / 10,
      letterGrade: getLetterGrade(overall),
      submissionCount: studentSubs.length,
      quizCount: studentQuizzes.length,
    };
  });

  // Get unique assignments for SpeedGrader
  const assignmentIds = [...new Set(submissions.map((s) => s.assignment_id))];

  const handleExportCSV = () => {
    const header = 'Student,Email,Progress,Assignment Avg,Quiz Avg,Overall,Letter Grade\n';
    const rows = studentGrades
      .map(
        (s) =>
          `"${s.profile.full_name}","${s.profile.email}",${s.progress}%,${s.assignmentAvg?.toFixed(1) ?? '-'},${s.quizAvg?.toFixed(1) ?? '-'},${s.overall}%,${s.letterGrade}`,
      )
      .join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook-${courseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-brand-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-brand-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{enrollments.length}</p>
            <p className="text-sm text-slate-700">Students</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-brand-orange-100 rounded-lg">
            <FileText className="w-5 h-5 text-brand-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{submissions.length}</p>
            <p className="text-sm text-slate-700">Submissions</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-brand-green-100 rounded-lg">
            <ClipboardList className="w-5 h-5 text-brand-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{quizAttempts.length}</p>
            <p className="text-sm text-slate-700">Quiz Attempts</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'overview'
                ? 'bg-brand-blue-600 text-white'
                : 'bg-white text-slate-900 hover:bg-slate-50'
            }`}
          >
            Grade Overview
          </button>
          <button
            onClick={() => setTab('speedgrader')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'speedgrader'
                ? 'bg-brand-blue-600 text-white'
                : 'bg-white text-slate-900 hover:bg-slate-50'
            }`}
          >
            SpeedGrader
          </button>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Assignments
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Quizzes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Overall
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {studentGrades.length > 0 ? (
                studentGrades.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{s.profile.full_name}</p>
                      <p className="text-sm text-slate-700">{s.profile.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ProgressCell enrollmentId={s.id} initialProgress={s.progress || 0} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {s.assignmentAvg !== null ? `${s.assignmentAvg.toFixed(1)}%` : '-'}
                      <span className="text-slate-700 ml-1">({s.submissionCount})</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {s.quizAvg !== null ? `${s.quizAvg.toFixed(1)}%` : '-'}
                      <span className="text-slate-700 ml-1">({s.quizCount})</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{s.overall}%</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          s.overall >= 90
                            ? 'bg-brand-green-100 text-brand-green-700'
                            : s.overall >= 70
                              ? 'bg-brand-blue-100 text-brand-blue-700'
                              : s.overall >= 60
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-brand-red-100 text-brand-red-700'
                        }`}
                      >
                        {s.letterGrade}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-700">
                    No students enrolled
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SpeedGrader Tab */}
      {tab === 'speedgrader' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {assignmentIds.length > 0 ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Select Assignment
                </label>
                <select
                  value={selectedAssignment || ''}
                  onChange={(e) => setSelectedAssignment(e.target.value || null)}
                  className="border rounded-lg px-3 py-2 w-full max-w-md"
                >
                  <option value="">Choose an assignment...</option>
                  {assignmentIds.map((id) => (
                    <option key={id} value={id}>
                      Assignment {id.slice(0, 8)}...
                    </option>
                  ))}
                </select>
              </div>
              {selectedAssignment && (
                <SpeedGrader
                  submissions={submissions
                    .filter((s) => s.assignment_id === selectedAssignment)
                    .map((s) => ({
                      id: s.id,
                      assignmentId: s.assignment_id,
                      studentId: s.user_id,
                      submittedAt: new Date(s.submitted_at),
                      content: s.content || '',
                      status:
                        (s.status as 'submitted' | 'graded' | 'returned' | 'late') || 'submitted',
                      isLate: false,
                    }))}
                  assignment={{
                    id: selectedAssignment,
                    title: `Assignment ${selectedAssignment.slice(0, 8)}`,
                    points: 100,
                  }}
                  onGrade={async (submissionId, grade) => {
                    // Route through /api/grade/upsert so FERPA audit log fires
                    await fetch('/api/grade/upsert', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        gradeItemId: submissionId,
                        enrollmentId: submissionId,
                        points: grade.percentage,
                      }),
                    });
                  }}
                />
              )}
            </>
          ) : (
            <p className="text-slate-700 text-center py-8">
              No assignment submissions to grade yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
