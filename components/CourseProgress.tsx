"use client";

import { Circle } from 'lucide-react';

interface CourseProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function CourseProgress({ current, total, className = '' }: CourseProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-black font-medium">
          {current} of {total} lessons complete
        </span>
        <span className="text-brand-orange-600 font-semibold">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className="   h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage === 100 && (
        <div className="flex items-center gap-2 mt-2 text-brand-orange-600 text-sm font-medium">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <span>Course completed!</span>
        </div>
      )}
    </div>
  );
}

interface LessonProgressIndicatorProps {
  completed: boolean;
  current?: boolean;
}

export function LessonProgressIndicator({ completed, current }: LessonProgressIndicatorProps) {
  if (completed) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-orange-500 text-white">
        <span className="text-slate-400 flex-shrink-0">•</span>
      </div>
    );
  }

  if (current) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-emerald-500 bg-red-50">
        <div className="w-2 h-2 rounded-full bg-brand-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-300">
      <Circle className="w-4 h-4 text-slate-300" />
    </div>
  );
}
