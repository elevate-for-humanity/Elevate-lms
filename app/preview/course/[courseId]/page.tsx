'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  BookOpen, CheckCircle, Award, Clock, BarChart3,
  Shield, FileText, Wrench,
} from 'lucide-react';
import LessonPlayer from '@/components/lms/LessonPlayer';

/* ── Credential mapping ───────────────────────────────────── */

const CREDENTIAL_MAP: Record<string, { credential: string; issuer: string; icon: typeof Award }> = {
  'hvac': { credential: 'EPA 608 Universal Certification', issuer: 'U.S. Environmental Protection Agency', icon: Shield },
  'welding': { credential: 'AWS D1.1 Structural Welding', issuer: 'American Welding Society', icon: Wrench },
  'electrical': { credential: 'OSHA 10-Hour Construction Safety', issuer: 'Occupational Safety & Health Administration', icon: Shield },
  'cna': { credential: 'Certified Nursing Assistant (CNA)', issuer: 'Indiana State Department of Health', icon: Award },
  'cdl': { credential: 'Commercial Driver License (CDL) Class A', issuer: 'Indiana Bureau of Motor Vehicles', icon: FileText },
  'phlebotomy': { credential: 'Certified Phlebotomy Technician (CPT)', issuer: 'National Healthcareer Association', icon: Award },
  'cybersecurity': { credential: 'CompTIA Security+', issuer: 'CompTIA', icon: Shield },
  'it': { credential: 'CompTIA A+ Certification', issuer: 'CompTIA', icon: Shield },
  'tax': { credential: 'IRS Annual Filing Season Program (AFSP)', issuer: 'Internal Revenue Service', icon: FileText },
  'barber': { credential: 'Indiana Barber License', issuer: 'Indiana Professional Licensing Agency', icon: Award },
  'trades': { credential: 'OSHA 10-Hour + NCCER Core Curriculum', issuer: 'OSHA / NCCER', icon: Wrench },
};

function getCredentialForCourse(course: any): { credential: string; issuer: string; icon: typeof Award } | null {
  if (!course) return null;
  const text = `${course.title || ''} ${course.course_name || ''} ${course.category || ''} ${course.certification_name || ''}`.toLowerCase();
  for (const [key, value] of Object.entries(CREDENTIAL_MAP)) {
    if (text.includes(key)) return value;
  }
  return null;
}

/* ── Competency checklist per category ────────────────────── */

const COMPETENCY_MAP: Record<string, string[]> = {
  'hvac': [
    'Identify refrigerant types and safe handling procedures',
    'Demonstrate proper use of manifold gauge sets',
    'Explain the refrigeration cycle and heat transfer principles',
    'Perform leak detection using approved methods',
    'Apply EPA Section 608 regulations to service scenarios',
  ],
  'welding': [
    'Set up and operate SMAW (stick) welding equipment',
    'Perform fillet and groove welds to AWS standards',
    'Read and interpret welding symbols on blueprints',
    'Identify and correct common weld defects',
    'Apply workplace safety and PPE requirements',
  ],
  'trades': [
    'Identify career pathways in skilled trades',
    'Demonstrate workplace safety fundamentals (OSHA 10)',
    'Read basic construction drawings and specifications',
    'Use hand and power tools safely and correctly',
    'Apply math skills to trade calculations',
  ],
  'electrical': [
    'Apply NEC code requirements to residential circuits',
    'Demonstrate safe lockout/tagout procedures',
    'Calculate voltage, amperage, and resistance using Ohm\'s Law',
    'Install and terminate common conductor types',
    'Identify and correct electrical hazards',
  ],
  'default': [
    'Demonstrate understanding of core subject matter',
    'Apply learned concepts to practical scenarios',
    'Meet minimum assessment score requirements',
    'Complete all required coursework hours',
    'Pass end-of-course competency evaluation',
  ],
};

function getCompetencies(course: any): string[] {
  if (!course) return COMPETENCY_MAP['default'];
  const text = `${course.title || ''} ${course.course_name || ''} ${course.category || ''}`.toLowerCase();
  for (const [key, items] of Object.entries(COMPETENCY_MAP)) {
    if (key !== 'default' && text.includes(key)) return items;
  }
  return COMPETENCY_MAP['default'];
}

/* ── Component ────────────────────────────────────────────── */

export default function CoursePreviewPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewedLessons, setViewedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { data: courseData } = await supabase
      .from('training_courses')
      .select('*')
      .eq('id', courseId)
      .single();

    const { data: lessonsData } = await supabase
      .from('training_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_number');

    if (courseData) setCourse(courseData);
    if (lessonsData) {
      setLessons(lessonsData);
      if (lessonsData.length > 0) {
        setActiveLesson(lessonsData[0]);
        setViewedLessons(new Set([lessonsData[0].id]));
      }
    }
    setLoading(false);
  };

  // Track viewed lessons for progress
  const markViewed = (lessonId: string) => {
    setViewedLessons(prev => new Set([...prev, lessonId]));
  };

  const credential = useMemo(() => getCredentialForCourse(course), [course]);
  const competencies = useMemo(() => getCompetencies(course), [course]);
  const progressPct = lessons.length > 0 ? Math.round((viewedLessons.size / lessons.length) * 100) : 0;
  const totalHours = useMemo(() => {
    const mins = lessons.reduce((sum, l) => sum + (l.duration_minutes || 60), 0);
    return Math.round(mins / 60 * 10) / 10;
  }, [lessons]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-500 mx-auto" />
          <p className="mt-3 text-sm text-slate-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-lg font-semibold">Course not found</p>
          <p className="text-sm text-slate-400 mt-1">This course may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const activeIdx = lessons.findIndex((l: any) => l.id === activeLesson?.id);
  const CredIcon = credential?.icon || Award;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header with progress */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-brand-blue-400 text-sm font-medium">Course Preview</p>
              <h1 className="text-xl font-bold">{course.title || course.course_name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {lessons.length} Lessons</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {totalHours} Hours</span>
                <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> {course.difficulty || 'All Levels'}</span>
              </div>
              <span className="bg-brand-blue-600/20 text-brand-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                {progressPct}%
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div
              className="bg-brand-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Credential mapping banner */}
        {credential && (
          <div className="border-t border-slate-800 bg-slate-900/80">
            <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-3">
              <CredIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-slate-300">
                <span className="text-amber-400 font-semibold">Credential Alignment:</span>{' '}
                This course prepares you for <span className="text-white font-medium">{credential.credential}</span>
                {' '}<span className="text-slate-500">issued by {credential.issuer}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-0">
        {/* Sidebar */}
        <aside className="lg:w-80 bg-slate-900/50 border-r border-slate-800 lg:min-h-[calc(100vh-120px)]">
          <div className="p-4">
            {/* Sidebar progress summary */}
            <div className="mb-4 pb-4 border-b border-slate-800">
              <p className="text-xs text-slate-500 mb-1">{viewedLessons.size} of {lessons.length} viewed</p>
              <div className="w-full bg-slate-800 rounded-full h-1">
                <div className="bg-brand-green-500 h-1 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Lessons</h2>
            <nav className="space-y-1">
              {lessons.map((lesson, i) => {
                const isActive = activeLesson?.id === lesson.id;
                const isViewed = viewedLessons.has(lesson.id);
                const hasVideo = lesson.video_url && !lesson.video_url.endsWith('.mp3');
                return (
                  <button
                    key={lesson.id}
                    onClick={() => { setActiveLesson(lesson); markViewed(lesson.id); }}
                    className={`w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition ${
                      isActive
                        ? 'bg-brand-blue-600/20 text-brand-blue-400 border border-brand-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isViewed && !isActive ? 'bg-brand-green-600/20 text-brand-green-400' :
                      isActive ? 'bg-brand-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {isViewed && !isActive ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lesson.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {hasVideo ? 'Video' : 'Audio'} · {lesson.duration_minutes || 60} min
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {activeLesson && (
            <>
              {/* Hardened LessonPlayer — handles video/audio/missing automatically */}
              <div className="mb-6">
                <LessonPlayer
                  key={activeLesson.id}
                  videoUrl={activeLesson.video_url || ''}
                  lessonTitle={activeLesson.title}
                  moduleTitle={course.title || course.course_name}
                  lessonNumber={activeIdx + 1}
                  totalLessons={lessons.length}
                  durationMinutes={activeLesson.duration_minutes}
                  onComplete={() => markViewed(activeLesson.id)}
                />
              </div>

              {/* Lesson info */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
                <h2 className="text-2xl font-bold mb-2">{activeLesson.title}</h2>
                <p className="text-slate-400 mb-4">
                  Lesson {activeIdx + 1} of {lessons.length}
                </p>

                {activeLesson.content && (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed">{activeLesson.content}</p>
                  </div>
                )}

                {activeLesson.topics && activeLesson.topics.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Topics Covered</h3>
                    <div className="flex flex-wrap gap-2">
                      {activeLesson.topics.map((topic: string, i: number) => (
                        <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                {activeIdx > 0 ? (
                  <button
                    onClick={() => { setActiveLesson(lessons[activeIdx - 1]); markViewed(lessons[activeIdx - 1].id); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition"
                  >
                    ← Previous Lesson
                  </button>
                ) : <div />}

                {activeIdx < lessons.length - 1 ? (
                  <button
                    onClick={() => { setActiveLesson(lessons[activeIdx + 1]); markViewed(lessons[activeIdx + 1].id); }}
                    className="px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 rounded-lg text-sm transition"
                  >
                    Next Lesson →
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-brand-green-600/20 text-brand-green-400 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Course Complete
                  </span>
                )}
              </div>

              {/* Competency Checklist — shows after last lesson or when all viewed */}
              {(activeIdx === lessons.length - 1 || progressPct === 100) && (
                <div className="mt-8 bg-slate-900/50 rounded-xl border border-amber-500/20 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Competency Checklist</h3>
                      <p className="text-xs text-slate-400">Skills demonstrated upon course completion</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {competencies.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-brand-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                  {credential && (
                    <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
                      Successful completion prepares learners for: <span className="text-amber-400">{credential.credential}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
