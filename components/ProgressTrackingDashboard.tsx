'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

type CourseProgress = {
  id: string;
  title?: string;
  course_name?: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  lastActivity: string;
  continueUrl: string;
  status: 'on-track' | 'behind' | 'ahead';
  nextMilestone: string;
};

type OverallProgress = {
  completionRate: number;
  studyHours: number;
  coursesInProgress: number;
  coursesCompleted: number;
  streak: number;
  averageScore: number;
};

export function ProgressTrackingDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [overallProgress, setOverallProgress] = useState<OverallProgress>({ completionRate: 0, studyHours: 0, coursesInProgress: 0, coursesCompleted: 0, streak: 0, averageScore: 0 });
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<Array<{ day: string; completed: number }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch(`/api/learner/progress?range=${encodeURIComponent(timeRange)}`, { signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.data) throw new Error(result.error || 'Progress could not be loaded.');
        return result;
      })
      .then(result => {
        setOverallProgress(result.data.overallProgress);
        setCourses(result.data.courses);
        setWeeklyActivity(result.data.weeklyActivity);
      })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [timeRange]);

  if (loading) return <div className="py-12 text-center text-slate-500">Loading progress…</div>;
  if (error) return <p role="alert" className="py-12 text-center text-red-700">{error}</p>;
  if (!courses.length) return <div className="py-12 text-center text-slate-500">No progress data yet. Enroll in a course to get started.</div>;

  const maxHours = Math.max(1, ...weeklyActivity.map((day) => day.completed));

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 py-10 text-white"><div className="mx-auto max-w-7xl px-4"><h1 className="text-3xl font-bold">Progress Dashboard</h1><p className="mt-2 text-slate-300">Track verified course activity and progress.</p></div></section>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-bold">Overview</h2><select value={timeRange} onChange={(event) => setTimeRange(event.currentTarget.value)} className="rounded-lg border px-4 py-2"><option value="week">This Week</option><option value="month">This Month</option><option value="year">This Year</option></select></div>
        <div className="mb-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[['Completion', `${overallProgress.completionRate}%`], ['Recorded Study Hours', `${overallProgress.studyHours}h`], ['In Progress', overallProgress.coursesInProgress], ['Completed', overallProgress.coursesCompleted], ['Streak', `${overallProgress.streak} days`], ['Average Score', `${overallProgress.averageScore}%`]].map(([label, value]) => <Card key={String(label)} className="p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></Card>)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6"><h3 className="text-xl font-bold">Completed Lessons in Selected Period</h3><div className="mt-4 space-y-3">{weeklyActivity.map((day) => <div key={day.day}><div className="mb-1 flex justify-between text-sm"><span>{day.day}</span><span>{day.completed} lessons</span></div><div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-brand-blue-600" style={{ width: `${Math.min(100, (day.completed / maxHours) * 100)}%` }} /></div></div>)}</div></Card>
          <Card className="p-6"><h3 className="text-xl font-bold">Course Progress</h3><div className="mt-4 space-y-4">{courses.map((course) => <div key={course.id} className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between gap-4"><div><h4 className="font-bold text-slate-950">{course.course_name || course.title || 'Course'}</h4><p className="text-sm text-slate-600">{course.lessonsCompleted} of {course.totalLessons} lessons completed</p><p className="text-xs text-slate-500">Last activity: {course.lastActivity}</p></div><p className="text-xl font-bold text-brand-orange-600">{course.progress}%</p></div><div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-brand-orange-500" style={{ width: `${Math.min(100, Math.max(0, course.progress))}%` }} /></div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-sm text-slate-700"><strong>Next:</strong> {course.nextMilestone}</p><Link href={course.continueUrl} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white">Continue</Link></div></div>)}</div></Card>
        </div>
      </div>
    </main>
  );
}

export default ProgressTrackingDashboard;
