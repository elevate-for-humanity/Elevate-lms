'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, Video, FileText, ClipboardCheck, Wrench, FlaskConical,
  ChevronRight, Play, X, Award, CheckCircle, Clock, Users,
} from 'lucide-react';
import type { CourseDefinition, CourseLesson, CourseModule } from '@/lib/courses/definitions';
import {
  HVAC_COURSE_ID,
  HVAC_FIRST_LESSON_ID as FIRST_LESSON_ID,
  HVAC_LESSON_UUID as LESSON_UUID,
  HVAC_MODULE_FIRST_LESSON as MODULE_FIRST_LESSON,
} from '@/lib/courses/hvac-uuids';
import { QuizPanel } from './QuizPanel';
import { EPA_608_CORE, EPA_608_TYPE_I, EPA_608_TYPE_II, EPA_608_TYPE_III, getUniversalExam } from '@/lib/courses/hvac-quizzes';
import type { QuizQuestion } from '@/lib/courses/hvac-quizzes';

/* ── Helpers ── */

function lessonUrl(id: string) { return `/courses/${HVAC_COURSE_ID}/lessons/${id}`; }
function lessonUrlById(defId: string) {
  const uuid = LESSON_UUID[defId];
  if (uuid) return lessonUrl(uuid);
  return lessonUrl(MODULE_FIRST_LESSON[defId.replace(/-\d+$/, '')] || FIRST_LESSON_ID);
}

const TYPE_ICON: Record<CourseLesson['type'], React.ElementType> = {
  video: Video, reading: FileText, quiz: ClipboardCheck, assignment: Wrench, lab: FlaskConical,
};
const TYPE_LABEL: Record<CourseLesson['type'], string> = {
  video: 'Video', reading: 'Reading', quiz: 'Quiz', assignment: 'Assignment', lab: 'Lab',
};

// One image per module — all real workforce/HVAC photos
const MODULE_PHOTO: string[] = [
  '/images/pages/comp-cta-training.jpg',
  '/images/pages/comp-pathway-trades.jpg',
  '/images/pages/comp-pathway-trades.jpg',
  '/images/pages/comp-pathway-trades.jpg',
  '/images/pages/comp-pathway-trades.jpg',
  '/images/pages/comp-pathway-trades.jpg',
  '/images/pages/comp-cta-training.jpg',
  '/images/pages/comp-pathway-trades.jpg',
  '/images/pages/comp-pathway-trades.jpg',
  '/images/pages/comp-pathway-trades.jpg',
  '/images/pages/comp-pathway-trades.jpg',
  '/images/pages/comp-cta-training.jpg',
  '/images/pages/comp-cta-training.jpg',
  '/images/pages/comp-cta-career.jpg',
  '/images/pages/comp-cta-career.jpg',
  '/images/pages/comp-cta-career.jpg',
];

function modProgress(mod: CourseModule, done: string[]) {
  const t = mod.lessons.length;
  const c = mod.lessons.filter((l) => done.includes(LESSON_UUID[l.id] || l.id)).length;
  return { total: t, completed: c, pct: t > 0 ? Math.round((c / t) * 100) : 0 };
}

function findNext(modules: CourseModule[], done: string[]) {
  for (let mi = 0; mi < modules.length; mi++) {
    for (const l of modules[mi].lessons) {
      if (!done.includes(LESSON_UUID[l.id] || l.id))
        return { lessonId: LESSON_UUID[l.id] || l.id, title: l.title, modIndex: mi, modTitle: modules[mi].title };
    }
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════
   Lesson Drawer — slides in from right when a module card is clicked
   ══════════════════════════════════════════════════════════════════ */

function LessonDrawer({ module, index, done, onClose }: {
  module: CourseModule; index: number; done: string[]; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">

        {/* Header image */}
        <div className="relative h-52">
          <Image src={MODULE_PHOTO[index] || MODULE_PHOTO[0]} alt={module.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/90 via-brand-blue-900/40 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100 transition shadow-lg">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Week {index + 1}</p>
            <h2 className="text-xl font-extrabold leading-tight mt-1">{module.title}</h2>
          </div>
        </div>

        <div className="p-6">
          {/* Objectives */}
          {module.objectives && module.objectives.length > 0 && (
            <div className="mb-6 bg-brand-blue-50 rounded-2xl p-5">
              <p className="text-[11px] font-bold text-brand-blue-800 uppercase tracking-widest mb-3">Learning Objectives</p>
              <ul className="space-y-2.5">
                {module.objectives.map((obj, oi) => (
                  <li key={oi} className="flex items-start gap-2.5 text-sm text-brand-blue-900">
                    <CheckCircle className="w-4 h-4 text-brand-blue-500 mt-0.5 flex-shrink-0" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Milestone */}
          {module.milestone && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-brand-red-50 border border-brand-red-200 rounded-xl">
              <Award className="w-5 h-5 text-brand-red-600" />
              <span className="text-sm font-bold text-brand-red-800">{module.milestone}</span>
            </div>
          )}

          {/* Lesson list */}
          <div className="space-y-1">
            {module.lessons.map((lesson, li) => {
              const Ic = TYPE_ICON[lesson.type] || BookOpen;
              const uuid = LESSON_UUID[lesson.id] || lesson.id;
              const isDone = done.includes(uuid);
              return (
                <Link key={lesson.id} href={lessonUrlById(lesson.id)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isDone ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-blue-100 group-hover:text-brand-blue-700'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : li + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Ic className="w-3 h-3 text-slate-400" />
                      <span className="text-[11px] text-slate-400">{TYPE_LABEL[lesson.type]}{lesson.durationMinutes ? ` \u00b7 ${lesson.durationMinutes} min` : ''}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Course Page
   ══════════════════════════════════════════════════════════════════ */

/* ── Practice Quiz Section ── */
const QUIZ_OPTIONS: { id: string; label: string; questions: QuizQuestion[]; desc: string }[] = [
  { id: 'core', label: 'EPA 608 Core', questions: EPA_608_CORE, desc: '25 questions — ozone, Clean Air Act, refrigerant safety, recovery/recycling' },
  { id: 'type1', label: 'EPA 608 Type I', questions: EPA_608_TYPE_I, desc: '25 questions — small appliances, self-contained recovery' },
  { id: 'type2', label: 'EPA 608 Type II', questions: EPA_608_TYPE_II, desc: '25 questions — high-pressure systems, evacuation, leak detection' },
  { id: 'type3', label: 'EPA 608 Type III', questions: EPA_608_TYPE_III, desc: '25 questions — low-pressure systems, chillers, purge units' },
  { id: 'universal', label: 'Universal (Full Exam)', questions: getUniversalExam(), desc: '100 questions — all four sections combined, 70% per section to pass' },
];

function PracticeQuizSection() {
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const active = QUIZ_OPTIONS.find(q => q.id === activeQuiz);

  return (
    <section className="mb-14">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Practice Quizzes</h2>
      <p className="text-sm text-slate-500 mb-6">Test your knowledge with EPA 608 practice exams. These match the format and difficulty of the proctored certification exam.</p>

      {!activeQuiz ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUIZ_OPTIONS.map(q => (
            <button
              key={q.id}
              onClick={() => setActiveQuiz(q.id)}
              className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-brand-red-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-brand-red-50 rounded-lg flex items-center justify-center group-hover:bg-brand-red-100 transition-colors">
                  <ClipboardCheck className="w-5 h-5 text-brand-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{q.label}</h3>
                  <span className="text-[11px] text-slate-400">{q.questions.length} questions</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{q.desc}</p>
            </button>
          ))}
        </div>
      ) : active ? (
        <div>
          <button
            onClick={() => setActiveQuiz(null)}
            className="mb-4 text-sm text-slate-500 hover:text-brand-red-600 transition-colors flex items-center gap-1"
          >
            ← Back to quiz selection
          </button>
          <QuizPanel
            questions={active.questions}
            lessonTitle={active.label}
            onPass={() => {}}
          />
        </div>
      ) : null}
    </section>
  );
}

export default function HvacCourseHome({
  course, completedLessonIds = [], progressPercent = 0,
  lastLessonId = null, lastLessonTitle = null, totalTimeSeconds = 0,
}: {
  course: CourseDefinition;
  completedLessonIds?: string[];
  progressPercent?: number;
  lastLessonId?: string | null;
  lastLessonTitle?: string | null;
  totalTimeSeconds?: number;
}) {
  const [openModule, setOpenModule] = useState<number | null>(null);

  const total = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const done = completedLessonIds.length;
  const next = useMemo(() => findNext(course.modules, completedLessonIds), [course.modules, completedLessonIds]);
  const continueUrl = lastLessonId ? lessonUrl(lastLessonId) : next ? lessonUrl(next.lessonId) : lessonUrl(FIRST_LESSON_ID);

  return (
    <div className="min-h-screen bg-white">

      {/* ═══════════════════════════════════════════════════════════
          HERO — Dark with HVAC image, Elevate red/blue branding
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-blue-900">
          <Image src="/images/pages/programs-hvac-course-hero.jpg" alt="HVAC technician working" fill className="object-cover opacity-20" priority />
        </div>
        {/* Red accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red-600" />

        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <span className="px-3 py-1 bg-brand-red-600 text-white text-xs font-bold rounded-full tracking-wide">ETPL APPROVED</span>
              <span className="px-3 py-1 bg-white/15 text-white text-xs font-bold rounded-full tracking-wide">WIOA ELIGIBLE</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-[1.1]">
              HVAC Technician<br />Certification Pathway
            </h1>
            <p className="text-white/60 text-base md:text-lg mt-4 max-w-lg leading-relaxed">
              12-week structured workforce pathway. EPA 608 Universal, OSHA 30, CPR/AED, and employer placement.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link href={continueUrl}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition text-sm shadow-lg shadow-brand-red-600/30">
                <Play className="w-4 h-4" /> {done > 0 ? 'Continue Learning' : 'Start Course'}
              </Link>
              {done > 0 && (
                <div className="flex items-center gap-3 px-5 py-3 bg-white/10 rounded-xl backdrop-blur">
                  <div>
                    <p className="text-white text-sm font-bold">{done}/{total} lessons</p>
                    <p className="text-white/40 text-xs">{progressPercent}% complete</p>
                  </div>
                  <div className="w-24 bg-white/20 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          STATS BAR — Clean, minimal
          ═══════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-6 md:gap-10 text-sm">
          {[
            { icon: Clock, text: <>12 weeks &middot; 15–20 hrs/wk</> },
            { icon: BookOpen, text: <>{total} lessons &middot; {course.modules.length} modules</> },
            { icon: Award, text: <>6 credentials included</> },
            { icon: Users, text: <>Online RTI + Lab + OJT</> },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-600">
              <item.icon className="w-4 h-4 text-brand-blue-500" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ═══════════════════════════════════════════════════════════
            CREDENTIALS — Three clean cards, Elevate colors
            ═══════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Credentials Earned</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                name: 'EPA 608 Universal',
                issuer: 'Environmental Protection Agency',
                desc: 'Required to purchase and handle refrigerants. Covers small appliances, high-pressure, and low-pressure systems.',
                bg: 'bg-brand-blue-50', border: 'border-brand-blue-200', accent: 'text-brand-blue-700', check: 'text-brand-blue-500',
              },
              {
                name: 'OSHA 30-Hour Construction',
                issuer: 'Occupational Safety & Health Administration',
                desc: 'Industry-standard safety certification covering fall protection, electrical safety, HazCom, and PPE.',
                bg: 'bg-brand-red-50', border: 'border-brand-red-200', accent: 'text-brand-red-700', check: 'text-brand-red-500',
              },
              {
                name: 'CPR / First Aid / AED',
                issuer: 'Nationally Accredited Provider',
                desc: 'Emergency response certification valid for 2 years. Required by most HVAC employers for field positions.',
                bg: 'bg-slate-50', border: 'border-slate-200', accent: 'text-slate-700', check: 'text-slate-500',
              },
            ].map((cred) => (
              <div key={cred.name} className={`${cred.bg} ${cred.border} border rounded-2xl p-6`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className={`w-5 h-5 ${cred.check}`} />
                  <h3 className={`font-bold ${cred.accent}`}>{cred.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">{cred.issuer}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{cred.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            PROGRAM OUTCOMES — What graduates can do
            ═══════════════════════════════════════════════════════════ */}
        {course.programOutcomes && course.programOutcomes.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Program Outcomes</h2>
            <p className="text-sm text-slate-500 mb-6">By completion, graduates will be able to:</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.programOutcomes.map((outcome, i) => {
                // Extract a short headline from the outcome
                const headlines = ['Refrigerant Compliance', 'System Diagnostics', 'Precision Measurement', 'Equipment Installation', 'Jobsite Safety'];
                const headline = headlines[i] || `Competency ${i + 1}`;
                return (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-brand-red-600 text-white text-xs font-bold rounded-lg flex items-center justify-center">{i + 1}</span>
                      <h3 className="font-bold text-slate-900 text-sm">{headline}</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{outcome}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CREDENTIAL PATHWAY — Apprentice → Master → Contractor
            ═══════════════════════════════════════════════════════════ */}
        {course.credentialPathway && course.credentialPathway.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Career Pathway</h2>
            <p className="text-sm text-slate-500 mb-6">Industry progression from entry to mastery.</p>

            {/* Horizontal timeline */}
            <div className="relative">
              {/* Connector line — hidden on mobile */}
              <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-slate-200" />

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {course.credentialPathway.map((level, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    {/* Node */}
                    <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold mb-3 shadow-md ${
                      i === 0
                        ? 'bg-brand-red-600 text-white ring-4 ring-brand-red-100'
                        : 'bg-white text-slate-600 border-2 border-slate-200'
                    }`}>
                      {level.level}
                    </div>
                    {i === 0 && <span className="px-2.5 py-0.5 bg-brand-red-600 text-white text-[10px] font-bold rounded-full mb-2">THIS PROGRAM</span>}
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{level.title}</h3>
                    <p className="text-[11px] text-slate-400 mb-2">{level.typicalTimeline}</p>
                    <ul className="space-y-1 text-left">
                      {level.requirements.map((req, j) => (
                        <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <CheckCircle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${i === 0 ? 'text-brand-red-500' : 'text-slate-400'}`} />
                          {req}
                        </li>
                      ))}
                    </ul>
                    {/* Arrow between nodes — hidden on mobile */}
                    {i < course.credentialPathway.length - 1 && (
                      <div className="hidden lg:block absolute top-8 text-slate-300 text-xl" style={{ left: `${(i + 1) * 25}%`, transform: 'translateX(-50%)' }}>→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
            12-WEEK SCHEDULE — Weekly competency statements
            ═══════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">12-Week Schedule</h2>
          <p className="text-sm text-slate-500 mb-6">Weekly competency milestones — 20 hours/week hybrid instruction.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {course.modules
              .filter(m => m.weekAssignment)
              .reduce((acc, mod) => {
                const week = mod.weekAssignment!.week;
                const existing = acc.find(w => w.week === week);
                if (existing) {
                  existing.modules.push(mod.title);
                } else {
                  acc.push({ week, statement: mod.weekAssignment!.weeklyCompetencyStatement, modules: [mod.title] });
                }
                return acc;
              }, [] as { week: number; statement: string; modules: string[] }[])
              .sort((a, b) => a.week - b.week)
              .map(w => (
                <div key={w.week} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-brand-blue-300 transition">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 bg-brand-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{w.week}</span>
                    <span className="text-[11px] font-bold text-slate-900">Wk {w.week}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{w.statement}</p>
                </div>
              ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            MODULES — Clean card grid, large images, minimal text
            ═══════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Course Modules</h2>
          <p className="text-sm text-slate-500 mb-8">Click any module to view lessons and learning objectives.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.modules.map((mod, i) => {
              const { total: mt, completed: mc, pct } = modProgress(mod, completedLessonIds);
              const isComplete = pct === 100;

              return (
                <button
                  key={mod.id}
                  onClick={() => setOpenModule(i)}
                  className="group text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-brand-blue-300 transition-all duration-200"
                >
                  {/* Image */}
                  <div className="relative h-44">
                    <Image
                      src={MODULE_PHOTO[i] || MODULE_PHOTO[0]}
                      alt={mod.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white text-brand-blue-800 text-[11px] font-bold rounded-lg shadow">
                      {mod.weekAssignment ? `Week ${mod.weekAssignment.week}` : `Module ${i + 1}`}
                    </div>

                    {isComplete && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-green-500 text-white text-[10px] font-bold rounded-lg shadow">
                        Complete
                      </div>
                    )}

                    {mod.milestone && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-red-600/90 backdrop-blur text-white text-[10px] font-bold rounded-lg">
                          <Award className="w-3 h-3" />
                          {mod.milestone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 leading-tight group-hover:text-brand-blue-600 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{mod.description}</p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{mt} lessons</span>
                        {mod.lessons.some(l => l.type === 'quiz') && (
                          <span className="flex items-center gap-1"><ClipboardCheck className="w-3 h-3" /> Quiz</span>
                        )}
                        {mod.lessons.some(l => l.type === 'lab') && (
                          <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" /> Lab</span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 transition-colors" />
                    </div>

                    {mc > 0 && (
                      <div className="mt-3">
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            ALIGNMENT — Two columns, clean lists
            ═══════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <div className="bg-slate-900 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Standards Alignment</h3>
                <p className="text-slate-400 text-[11px]">This program operates within recognized workforce and industry frameworks.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
              <div className="p-6">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Industry Certifications</h4>
                <ul className="space-y-3">
                  {[
                    'EPA Section 608 Universal — all equipment types',
                    'OSHA 30-Hour Construction Safety (DOL card)',
                    'Nationally accredited CPR/First Aid/AED',
                    'NRF Rise Up Retail Industry Fundamentals',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-brand-green-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Workforce Compliance</h4>
                <ul className="space-y-3">
                  {[
                    'U.S. Department of Labor competency framework',
                    'WIOA Title I eligible training provider (ETPL #10004322)',
                    'Documented assessment checkpoints per module',
                    'Participant progress tracking and completion reporting',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-brand-green-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            PRACTICE QUIZZES — EPA 608 exam prep
            ═══════════════════════════════════════════════════════════ */}
        <PracticeQuizSection />

        {/* ═══════════════════════════════════════════════════════════
            CAREER OUTCOMES — Bold stats
            ═══════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Career Outcomes</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { stat: '$51,390', label: 'Median Salary', sub: 'BLS 2024 for HVAC technicians' },
              { stat: '6%', label: 'Job Growth', sub: 'Projected through 2032' },
              { stat: '90%+', label: 'Placement Rate', sub: 'Graduates placed within 90 days' },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                <p className="text-4xl font-extrabold text-brand-blue-700">{item.stat}</p>
                <p className="text-sm font-bold text-slate-800 mt-2">{item.label}</p>
                <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CTA
            ═══════════════════════════════════════════════════════════ */}
        <section className="text-center py-10 border-t border-slate-200">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Ready to start your HVAC career?</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">12-week structured pathway with proctored EPA 608 certification and employer placement.</p>
          <Link href={continueUrl}
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition text-sm shadow-lg shadow-brand-red-600/25">
            <Play className="w-4 h-4" /> {done > 0 ? 'Continue Learning' : 'Enroll Now'}
          </Link>
        </section>
      </div>

      {/* ═══ Lesson Drawer ═══ */}
      {openModule !== null && (
        <LessonDrawer
          module={course.modules[openModule]}
          index={openModule}
          done={completedLessonIds}
          onClose={() => setOpenModule(null)}
        />
      )}
    </div>
  );
}
