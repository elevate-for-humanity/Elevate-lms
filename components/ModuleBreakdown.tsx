'use client';

import React from 'react';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Video, FileText, CheckSquare, Clock } from 'lucide-react';
import { LessonProgressIndicator } from './CourseProgress';

interface Lesson {
  id: string;
  title: string;
  duration: number; // in minutes
  type: 'video' | 'reading' | 'quiz';
  completed?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: number; // in hours
  lessons: Lesson[];
  videoCount: number;
  readingCount: number;
  quizCount: number;
}

interface ModuleBreakdownProps {
  modules: Module[];
  className?: string;
}

export function ModuleBreakdown({ modules, className = '' }: ModuleBreakdownProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set([modules[0]?.id]));

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'reading':
        return <FileText className="w-4 h-4" />;
      case 'quiz':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <section className={`bg-white rounded-2xl border border-slate-200 p-6 md:p-8 ${className}`}>
      <h2 className="text-2xl font-bold text-black mb-6">Course Modules</h2>
      <div className="space-y-4">
        {modules.map((module, index) => {
          const isExpanded = expandedModules.has(module.id);
          const completedLessons = module.lessons.filter((l) => l.completed).length;
          const totalLessons = module.lessons.length;

          return (
            <div key={module.id} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-brand-orange-600">
                      Module {index + 1}
                    </span>
                    <h3 className="font-semibold text-black">{module.title}</h3>
                  </div>
                  <p className="text-sm text-black mb-3">{module.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {module.duration} hours
                    </span>
                    {module.videoCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {module.videoCount} videos
                      </span>
                    )}
                    {module.readingCount > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {module.readingCount} readings
                      </span>
                    )}
                    {module.quizCount > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        {module.quizCount} quizzes
                      </span>
                    )}
                  </div>
                  {completedLessons > 0 && (
                    <div className="mt-2 text-xs text-brand-orange-600 font-medium">
                      {completedLessons} of {totalLessons} lessons complete
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Module Lessons */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50">
                  <ul className="divide-y divide-slate-200">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} className="p-4 hover:bg-white transition">
                        <div className="flex items-center gap-3">
                          <LessonProgressIndicator completed={lesson.completed || false} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-slate-400">{getLessonIcon(lesson.type)}</span>
                              <span className="text-sm font-medium text-black">{lesson.title}</span>
                            </div>
                            <span className="text-xs text-slate-500">{lesson.duration} min</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
