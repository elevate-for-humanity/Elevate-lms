'use client';

import { siteUrls } from '@/lib/utils/site-urls';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Play,
  Search,
} from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  lessonType: string;
  durationMinutes: number | null;
  orderIndex: number;
  simulation?: { id: string; title: string; mastered: boolean; started: boolean };
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: Lesson[];
};

type Props = {
  courseId: string;
  title: string;
  description: string | null;
  modules: Module[];
  completedLessonIds: string[];
  totalTimeSeconds: number;
  savedActivity?: { assessmentsPassed: number; videosCompleted: number } | null;
};

function lessonHref(courseId: string, lessonId: string) {
  return `/lms/courses/${courseId}/lessons/${lessonId}`;
}

export default function CanonicalHvacCourseHome({
  courseId,
  title,
  description,
  modules,
  completedLessonIds,
  totalTimeSeconds,
  savedActivity,
}: Props) {
  const [query, setQuery] = useState('');
  const completed = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);
  const lessons = useMemo(
    () =>
      modules
        .flatMap((module) => module.lessons)
        .sort((left, right) => left.orderIndex - right.orderIndex),
    [modules],
  );
  const simulationLessons = lessons.filter((lesson) => lesson.simulation);
  const masteredSimulations = simulationLessons.filter(
    (lesson) => lesson.simulation?.mastered,
  ).length;
  const nextSimulation =
    simulationLessons.find((lesson) => !lesson.simulation?.mastered) ?? simulationLessons[0];
  const visibleCompleted = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons[0] ?? null;
  const progress = lessons.length ? Math.round((visibleCompleted / lessons.length) * 100) : 0;
  const filteredModules = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return modules;
    return modules
      .map((module) => ({
        ...module,
        lessons: module.lessons.filter(
          (lesson) =>
            lesson.title.toLowerCase().includes(normalized) ||
            module.title.toLowerCase().includes(normalized) ||
            module.description?.toLowerCase().includes(normalized),
        ),
      }))
      .filter((module) => module.lessons.length > 0);
  }, [modules, query]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/pages/hvac-hero.webp"
          alt="HVAC technician working with heating and cooling equipment"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/45" />
        <div className="w-full min-w-0 px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">
            HVAC Technician
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">{description}</p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-200">
            <span className="rounded-full bg-white/10 px-3 py-2">{modules.length} modules</span>
            <span className="rounded-full bg-white/10 px-3 py-2">{lessons.length} lessons</span>
            {simulationLessons.length ? (
              <span className="rounded-full bg-cyan-900 px-3 py-2">
                {simulationLessons.length} interactive simulation labs
              </span>
            ) : null}
            <span className="rounded-full bg-white/10 px-3 py-2">EPA Section 608 preparation</span>
            <span className="rounded-full bg-white/10 px-3 py-2">
              {(totalTimeSeconds / 3600).toFixed(1)} hours of recorded lesson activity
            </span>
          </div>

          <div className="mt-7 max-w-xl">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>
                {visibleCompleted} of {lessons.length} lessons complete
              </span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/20"
              aria-label={`${progress}% course progress`}
            >
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {savedActivity ? (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200">
              {savedActivity.assessmentsPassed} lesson assessments passed ·{' '}
              {savedActivity.videosCompleted} lesson videos completed. These results stay saved
              while you finish the matching workbook reviews and remaining activities. Recorded
              lesson activity is separate from instructor-verified hands-on training hours.
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            {nextLesson ? (
              <Link
                href={lessonHref(courseId, nextLesson.id)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {completed.size ? 'Continue course' : 'Start course'}
              </Link>
            ) : null}
            <Link
              href="/programs/hvac-technician/practice"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-5 py-3 font-bold text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              EPA 608 practice tests
            </Link>
            <Link
              href="/workbooks/hvac-epa608-guided-practice"
              className="inline-flex min-h-11 items-center rounded-lg border border-white/40 px-5 py-3 font-bold text-white"
            >
              Workbook and simulator
            </Link>
            <a
              href={`${siteUrls.site}/docs/syllabi/hvac-technician.md`}
              className="inline-flex min-h-11 items-center rounded-lg border border-white/40 px-5 py-3 font-bold text-white"
            >
              View syllabus
            </a>
          </div>
        </div>
      </section>

      <main className="w-full min-w-0 px-4 py-10 sm:px-6 lg:px-8">
        {nextSimulation ? (
          <section
            aria-label="HVAC simulation practice"
            className="mb-8 rounded-2xl border border-cyan-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-cyan-800">
              Interactive HVAC practice
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Work through the whole course in the virtual lab
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
              Adjust controls, inspect simulated readings, and make service decisions in each
              instructional lesson. Your saved practice resumes where you left off. The four EPA
              practice tests remain part of this course.
            </p>
            <p className="mt-3 text-base font-semibold text-slate-800">
              {masteredSimulations} of {simulationLessons.length} simulations mastered
            </p>
            <Link
              href={`${lessonHref(courseId, nextSimulation.id)}#hvac-simulation`}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-cyan-800 px-5 py-3 text-base font-bold text-white hover:bg-cyan-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800"
            >
              {masteredSimulations === simulationLessons.length
                ? 'Practice again'
                : 'Continue simulation practice'}
            </Link>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Simulation results record virtual practice. Physical skills verification and
              certification testing are recorded separately.
            </p>
          </section>
        ) : null}
        <div className="mb-8 max-w-2xl">
          <label
            htmlFor="hvac-course-search"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Search this course
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="hvac-course-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lessons or modules"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-950 shadow-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/30"
            />
          </div>
        </div>

        {filteredModules.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8" aria-live="polite">
            <h2 className="text-xl font-bold">No lessons match your search</h2>
            <p className="mt-2 text-slate-700">Try a different topic or clear the search field.</p>
          </section>
        ) : (
          <div className="space-y-6">
            {filteredModules.map((module, moduleIndex) => {
              const completedInModule = module.lessons.filter((lesson) =>
                completed.has(lesson.id),
              ).length;
              return (
                <section
                  key={module.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                          Module {moduleIndex + 1}
                        </p>
                        <h2 className="mt-1 text-xl font-bold sm:text-2xl">{module.title}</h2>
                        {module.description ? (
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                            {module.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                        {completedInModule}/{module.lessons.length} complete
                      </span>
                    </div>
                  </div>

                  <ol className="divide-y divide-slate-100">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isComplete = completed.has(lesson.id);
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={lessonHref(courseId, lesson.id)}
                            className="group flex min-h-14 items-center gap-4 px-5 py-4 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:px-6"
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="h-5 w-5" aria-label="Completed" />
                              ) : (
                                <span className="text-sm font-bold">{lessonIndex + 1}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-950 group-hover:text-blue-800">
                                {lesson.title}
                              </p>
                              {lesson.simulation ? (
                                <p className="mt-1 text-sm leading-6 text-cyan-900">
                                  Simulation: {lesson.simulation.title} ·{' '}
                                  {lesson.simulation.mastered
                                    ? 'Mastered'
                                    : lesson.simulation.started
                                      ? 'In progress'
                                      : 'Ready to practice'}
                                </p>
                              ) : null}
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                                  {lesson.lessonType.replaceAll('_', ' ')}
                                </span>
                                {lesson.durationMinutes ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                    {lesson.durationMinutes} min
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <ChevronRight
                              className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-blue-700"
                              aria-hidden="true"
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
