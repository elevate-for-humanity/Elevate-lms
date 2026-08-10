'use client';

import { useCallback, useEffect, useState } from 'react';
import { Award, BookOpen, CheckCircle, Clock, Flame, Target, TrendingUp } from 'lucide-react';

interface ProgressData {
  overall_progress: number;
  courses_completed: number;
  courses_in_progress: number;
  total_courses: number;
  hours_studied: number;
  assignments_completed: number;
  assignments_total: number;
  quiz_average: number;
  streak_days: number;
  certificates_earned: number;
}

interface CourseProgress {
  id: string;
  title: string;
  course_name?: string;
  progress: number;
  last_accessed: string;
  grade?: number;
}

export function ProgressDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProgressData = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/progress`);
      if (res.ok) {
        const result = await res.json();
        setData(result.progress);
        setCourses(result.courses || []);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadProgressData();
  }, [loadProgressData]);

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6"><p className="text-center text-slate-500">Loading progress...</p></div>;
  if (!data) return <div className="rounded-lg border border-slate-200 bg-white p-6"><p className="text-center text-slate-500">No progress data available</p></div>;

  const stats = [
    { label: 'Overall Progress', value: `${data.overall_progress}%`, icon: TrendingUp },
    { label: 'Courses Completed', value: `${data.courses_completed}/${data.total_courses}`, icon: BookOpen },
    { label: 'Hours Studied', value: data.hours_studied, icon: Clock },
    { label: 'Quiz Average', value: `${data.quiz_average}%`, icon: Target },
    { label: 'Assignments', value: `${data.assignments_completed}/${data.assignments_total}`, icon: CheckCircle },
    { label: 'Certificates', value: data.certificates_earned, icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100"><Icon className="h-5 w-5 text-brand-blue-700" /></div>
              <p className="text-2xl font-bold text-black">{stat.value}</p>
              <p className="mt-1 text-xs text-black">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-black">Overall Progress</h3><span className="text-2xl font-bold text-brand-orange-600">{data.overall_progress}%</span></div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand-orange-500 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, data.overall_progress))}%` }} /></div>
        <div className="mt-2 flex items-center justify-between text-sm text-black"><span>{data.courses_completed} courses completed</span><span>{data.courses_in_progress} in progress</span></div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-black">Course Progress</h3>
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="border-b border-slate-200 pb-4 last:border-0">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-black">{course.course_name || course.title}</h4>
                  <p className="mt-1 text-xs text-slate-500">Last accessed: {new Date(course.last_accessed).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="ml-4 text-right"><p className="text-lg font-bold text-brand-orange-600">{course.progress}%</p>{course.grade !== undefined ? <p className="text-xs text-black">Grade: {course.grade}%</p> : null}</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand-orange-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, course.progress))}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      {data.streak_days > 0 ? (
        <div className="rounded-lg bg-slate-900 p-6 text-white">
          <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20"><Flame className="h-8 w-8 text-orange-500" /></div><div><p className="text-3xl font-bold">{data.streak_days} Days</p><p className="text-white/90">Learning Streak</p></div></div>
        </div>
      ) : null}
    </div>
  );
}
