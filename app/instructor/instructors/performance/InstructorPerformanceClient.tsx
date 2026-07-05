'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';

interface CoursePerf {
  name: string;
  students: number;
  completion: number;
}

export default function InstructorPerformanceClient() {
  const [courses, setCourses] = useState<CoursePerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/instructor/course-performance')
      .then(r => r.json())
      .then(d => setCourses(d.courses ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-brand-blue-600" />
        <h2 className="font-semibold text-slate-800">Program Completion Rates</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">No program data available</p>
      ) : (
        <div className="space-y-3">
          {courses.map(c => (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700 truncate max-w-xs">{c.name}</span>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-slate-500">{c.students} students</span>
                  <span className="text-xs font-semibold text-slate-800 tabular-nums w-10 text-right">{c.completion}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    c.completion >= 80 ? 'bg-green-500' :
                    c.completion >= 50 ? 'bg-brand-blue-500' :
                    'bg-amber-500'
                  }`}
                  style={{ width: `${c.completion}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
