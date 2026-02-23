'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Video,
  FileText,
  ClipboardCheck,
  Wrench,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Clock,
  Award,
  Shield,
  Users,
  ArrowLeft,
  Play,
  Lock,
} from 'lucide-react';
import type { CourseDefinition, CourseLesson, CourseModule } from '@/lib/courses/definitions';

/* ------------------------------------------------------------------ */
/*  Constants — deterministic UUIDs from the seed migration            */
/* ------------------------------------------------------------------ */

const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
const FIRST_LESSON_ID = '2f172cb2-4657-5460-9b93-f9b062ad8dd2';

/**
 * Maps each definition module id to the UUID of its first lesson in
 * training_lessons. Extracted from seed migration order_index X01 pattern.
 */
const MODULE_FIRST_LESSON: Record<string, string> = {
  'hvac-01': '2f172cb2-4657-5460-9b93-f9b062ad8dd2', // Welcome to HVAC Technician Training
  'hvac-02': 'ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56', // How HVAC Systems Work
  'hvac-03': 'dba03432-fb85-5f6f-bc69-4cc785a7904a', // Voltage, Current, Resistance & Ohm's Law
  'hvac-04': 'baed04b3-35ae-51c7-a325-c678fbd0e725', // Gas Furnace Operation
  'hvac-05': '3b753cee-2a4f-5702-9661-23d48f475b7b', // The Refrigeration Cycle
  'hvac-06': '785652db-1125-5e78-a1c9-de65f2aa331a', // Ozone Layer & Environmental Impact
  'hvac-07': '6116718a-264f-5d03-8e12-8b141debcd9d', // Small Appliance Systems
  'hvac-08': '97b819f5-81ff-5e3a-a165-911b207121d5', // High-Pressure System Overview
  'hvac-09': '68964a49-cfe1-5a4a-8e57-41a1dc3290e2', // Low-Pressure System Overview
  'hvac-10': '1482eb8f-9259-5f81-9871-50ba2998593d', // Core Section Review
  'hvac-11': '0f05573b-f248-5a46-8089-fecbdb568ed9', // Refrigerant Charging Methods
  'hvac-12': 'd14effbf-eb31-5686-aa9c-a83a6e4c9ce9', // Ductwork Design & Installation
  'hvac-13': '9b8de967-157d-5a9f-b3a5-f64ec6ca306d', // Systematic Troubleshooting Method
  'hvac-14': 'ce416471-0243-53cb-99af-8f4cb883c9f5', // OSHA 30 Overview & Worker Rights
  'hvac-15': '93ae75c1-65e2-57cd-99a3-3a3f91cd5733', // CPR & AED — Adult
  'hvac-16': '15d76752-0478-53f3-85c5-31c201cc9b09', // HVAC Resume Workshop
};

/** Public course detail page — no auth required */
function courseUrl() {
  return `/courses/${HVAC_COURSE_ID}`;
}

/** Direct lesson URL inside the LMS player (auth-gated, used after enrollment) */
function lmsLessonUrl(lessonId: string) {
  return `/lms/courses/${HVAC_COURSE_ID}/lessons/${lessonId}`;
}

/** Public-safe lesson link: goes to the public course page with a lesson anchor */
function publicLessonUrl(lessonId: string) {
  return `/courses/${HVAC_COURSE_ID}#lesson-${lessonId}`;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const LESSON_ICONS: Record<CourseLesson['type'], React.ElementType> = {
  video: Video,
  reading: FileText,
  quiz: ClipboardCheck,
  assignment: Wrench,
  lab: FlaskConical,
};

const LESSON_LABELS: Record<CourseLesson['type'], string> = {
  video: 'Video',
  reading: 'Reading',
  quiz: 'Quiz',
  assignment: 'Assignment',
  lab: 'Hands-On Lab',
};

function totalLessons(modules: CourseModule[]) {
  return modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

function totalMinutes(modules: CourseModule[]) {
  return modules.reduce(
    (sum, m) =>
      sum + m.lessons.reduce((ls, l) => ls + (l.durationMinutes ?? 0), 0),
    0,
  );
}

/* ------------------------------------------------------------------ */
/*  Module Accordion                                                   */
/* ------------------------------------------------------------------ */

function ModuleAccordion({
  module,
  index,
  isOpen,
  onToggle,
}: {
  module: CourseModule;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const moduleMins = module.lessons.reduce(
    (s, l) => s + (l.durationMinutes ?? 0),
    0,
  );
  const firstLessonId = MODULE_FIRST_LESSON[module.id];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center text-sm font-semibold">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {module.title}
            </p>
            <p className="text-sm text-gray-500">
              {module.lessons.length} lesson{module.lessons.length !== 1 && 's'}
              {moduleMins > 0 && <> &middot; {moduleMins} min</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {firstLessonId && (
            <Link
              href={publicLessonUrl(firstLessonId)}
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-colors"
            >
              <Play className="w-3 h-3" />
              Start
            </Link>
          )}
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
          {module.lessons.map((lesson, lessonIdx) => {
            const Icon = LESSON_ICONS[lesson.type];
            const isPreviewable = lessonIdx === 0 && firstLessonId;

            return (
              <div key={lesson.id} className="relative">
                {isPreviewable ? (
                  <Link
                    href={publicLessonUrl(firstLessonId)}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-brand-blue-50 transition-colors group"
                  >
                    <Icon className="w-4 h-4 mt-0.5 text-brand-blue-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-brand-blue-700">
                        {lesson.title}
                      </p>
                      {lesson.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                        {LESSON_LABELS[lesson.type]}
                      </span>
                      {lesson.durationMinutes && (
                        <span className="text-xs text-gray-400">
                          {lesson.durationMinutes}m
                        </span>
                      )}
                      <Play className="w-3.5 h-3.5 text-brand-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 px-5 py-3 opacity-60">
                    <Icon className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        {lesson.title}
                      </p>
                      {lesson.description && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-400">
                        {LESSON_LABELS[lesson.type]}
                      </span>
                      {lesson.durationMinutes && (
                        <span className="text-xs text-gray-400">
                          {lesson.durationMinutes}m
                        </span>
                      )}
                      <Lock className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function HvacCourseViewer({
  course,
}: {
  course: CourseDefinition;
}) {
  const [openModules, setOpenModules] = useState<Set<number>>(
    () => new Set([0]),
  );

  const toggle = (idx: number) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const expandAll = () =>
    setOpenModules(new Set(course.modules.map((_, i) => i)));
  const collapseAll = () => setOpenModules(new Set());

  const lessons = totalLessons(course.modules);
  const mins = totalMinutes(course.modules);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gray-900 text-white">
        <Image
          src="/images/trades/hero-program-hvac.jpg"
          alt="HVAC technician working on a commercial unit"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <Link
            href="/programs/hvac-technician"
            className="inline-flex items-center gap-1 text-sm text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to HVAC Program
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {course.title}
          </h1>
          <p className="mt-3 text-lg text-gray-300 max-w-2xl">
            {course.subtitle}
          </p>

          {/* Primary CTAs */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={courseUrl()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Learning
            </Link>
            <Link
              href="/programs/hvac-technician/apply"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
            >
              Apply for Enrollment
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-blue-400" />
              <span>
                {course.modules.length} modules &middot; {lessons} lessons
              </span>
            </div>
            {mins > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-blue-400" />
                <span>
                  ~{Math.round(mins / 60)} hr {mins % 60} min estimated
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-blue-400" />
              <span>{course.modality}</span>
            </div>
            {course.secondChanceFriendly && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Second-Chance Friendly</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-blue-400" />
              <span>{course.partner}</span>
            </div>
          </div>

          {/* Workforce tags */}
          {course.workforceTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {course.workforceTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Outcomes */}
      {course.outcomes.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            What You Will Achieve
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {course.outcomes.map((outcome, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Award className="w-4 h-4 mt-0.5 text-brand-blue-500 flex-shrink-0" />
                {outcome}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Curriculum Preview */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Course Curriculum</h2>
            <p className="text-sm text-gray-500 mt-1">
              Preview the full curriculum below. Enroll to unlock all lessons and track your progress.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {course.modules.map((mod, idx) => (
            <ModuleAccordion
              key={mod.id}
              module={mod}
              index={idx}
              isOpen={openModules.has(idx)}
              onToggle={() => toggle(idx)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-white border border-gray-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-bold text-gray-900">
            Ready to start your HVAC career?
          </h3>
          <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
            Enroll to unlock all {lessons} lessons, track your progress, earn certifications,
            and access the full LMS with quizzes, labs, and instructor support.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href={courseUrl()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Learning
            </Link>
            <Link
              href="/programs/hvac-technician/apply"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Apply Now
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Funding may be available through WIOA, Next Level Jobs, or Workforce Ready Grants.
          </p>
        </div>
      </section>
    </div>
  );
}
