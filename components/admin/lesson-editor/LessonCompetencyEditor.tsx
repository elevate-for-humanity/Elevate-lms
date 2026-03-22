'use client';

/**
 * LessonCompetencyEditor
 * Edits: lesson_competency_map — which competency codes this lesson covers.
 * Reads available competencies from course_competencies for the course.
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CourseCompetency {
  code:        string;
  label:       string;
  description: string;
}

interface Props {
  courseId:         string;
  lessonId:         string;
  mappedCodes:      string[];
  onChange:         (codes: string[]) => void;
}

export default function LessonCompetencyEditor({ courseId, lessonId, mappedCodes, onChange }: Props) {
  const [available, setAvailable] = useState<CourseCompetency[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('course_competencies')
        .select('code, label, description')
        .eq('course_id', courseId)
        .order('code');
      setAvailable(data ?? []);
      setLoading(false);
    }
    load();
  }, [courseId]);

  const toggle = (code: string) => {
    const next = mappedCodes.includes(code)
      ? mappedCodes.filter(c => c !== code)
      : [...mappedCodes, code];
    onChange(next);
  };

  if (loading) {
    return <p className="text-xs text-slate-400 animate-pulse">Loading competencies...</p>;
  }

  if (available.length === 0) {
    return (
      <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
        <p className="text-sm text-slate-400">No course competencies defined yet.</p>
        <p className="text-xs text-slate-400 mt-1">
          Add competencies at the course level first, then map them to lessons.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Select which competencies this lesson covers. Required for practical lesson types.
        {mappedCodes.length > 0 && (
          <span className="ml-2 font-semibold text-slate-700">{mappedCodes.length} mapped.</span>
        )}
      </p>

      <div className="space-y-2">
        {available.map(comp => {
          const isMapped = mappedCodes.includes(comp.code);
          return (
            <label
              key={comp.code}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                isMapped
                  ? 'border-brand-blue-300 bg-brand-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={isMapped}
                onChange={() => toggle(comp.code)}
                className="accent-brand-blue-600 w-4 h-4 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-500">{comp.code}</span>
                  <span className="text-sm font-semibold text-slate-800">{comp.label}</span>
                </div>
                {comp.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{comp.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
