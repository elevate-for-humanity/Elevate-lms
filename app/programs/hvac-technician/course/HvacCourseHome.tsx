'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, Video, FileText, ClipboardCheck, Wrench, FlaskConical,
  ChevronRight, Play, X, Maximize2,
} from 'lucide-react';
import type { CourseDefinition, CourseLesson, CourseModule } from '@/lib/courses/definitions';
import {
  HVAC_COURSE_ID,
  HVAC_FIRST_LESSON_ID as FIRST_LESSON_ID,
  HVAC_LESSON_UUID as LESSON_UUID,
  HVAC_MODULE_FIRST_LESSON as MODULE_FIRST_LESSON,
} from '@/lib/courses/hvac-uuids';

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

/*
 * 16 unique HVAC/trades images — all >200KB, no duplicates, contextually matched.
 */
const MODULE_PHOTO: string[] = [
  '/images/programs-hq/students-learning.jpg',                 // 1  Orientation — students in class
  '/images/trades/hero-program-hvac.jpg',                      // 2  Fundamentals — HVAC hero shot
  '/images/trades/electrical-hero.jpg',                        // 3  Electrical — wiring/panels
  '/images/programs-hq/hvac-technician.jpg',                   // 4  Heating — HVAC tech at work
  '/images/trades/program-hvac-technician.jpg',                // 5  Cooling — technician on unit
  '/images/trades/program-hvac-overview.jpg',                  // 6  EPA Core — HVAC overview
  '/images/hvac/hvac-service-tech.jpg',                        // 7  EPA Type I — service tech
  '/images/hvac/hvac-commercial.jpg',                          // 8  EPA Type II — commercial system
  '/images/programs-hq/electrical.jpg',                        // 9  EPA Type III — electrical/controls
  '/images/hvac/hvac-tools-equipment.jpg',                     // 10 EPA Final — tools & testing
  '/images/trades/program-plumbing-training.jpg',              // 11 Refrigerant — piping/lines
  '/images/trades/program-construction-training.jpg',          // 12 Installation — construction site
  '/images/trades/program-electrical-training.jpg',            // 13 Troubleshooting — diagnostics
  '/images/programs-hq/skilled-trades-hero.jpg',               // 14 OSHA — safety/trades
  '/images/healthcare/cpr-certification-group.jpg',            // 15 CPR — group certification
  '/images/career-coaching-new.jpg',                           // 16 Career — coaching session
];

const MODULE_DESC: string[] = [
  'Program overview, expectations, and workforce readiness.',
  'How HVAC systems work — components, airflow, safety.',
  'Circuits, wiring diagrams, multimeter use, electrical safety.',
  'Furnaces, heat pumps, gas valves, heating diagnostics.',
  'Refrigeration cycle, compressors, metering devices, cooling.',
  'EPA 608 core — ozone depletion, regulations, recovery.',
  'Small appliance systems — recovery requirements.',
  'High-pressure systems — leak detection, evacuation, charging.',
  'Low-pressure systems — centrifugal chillers, purge units.',
  'Full-length EPA 608 practice exam — 100 questions, timed.',
  'Refrigerant types, handling procedures, diagnostics.',
  'Equipment sizing, ductwork, line sets, commissioning.',
  'Systematic troubleshooting, service calls, documentation.',
  'OSHA 30-Hour — fall protection, electrical, scaffolding, HazCom.',
  'CPR/First Aid certification and Rise Up workforce readiness.',
  'Resume building, interview prep, employer introductions.',
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

function countType(lessons: CourseLesson[], t: CourseLesson['type']) {
  return lessons.filter((l) => l.type === t).length;
}

/* ── Full-Screen Video Player ── */
function VideoPlayer({ src, onClose }: { src: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handleFullscreen = () => { videoRef.current?.requestFullscreen?.(); };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition">
        <X className="w-5 h-5" />
      </button>
      <button onClick={handleFullscreen} className="absolute top-4 right-16 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition">
        <Maximize2 className="w-4 h-4" />
      </button>
      <video ref={videoRef} src={src} autoPlay controls className="w-full h-full max-h-screen object-contain" onEnded={onClose} />
    </div>
  );
}

/* ── Lesson Drawer ── */
function LessonDrawer({ module, index, done, onClose }: {
  module: CourseModule; index: number; done: string[]; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        <div className="relative h-44">
          <Image src={MODULE_PHOTO[index] || MODULE_PHOTO[0]} alt={module.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/40 transition">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Module {index + 1}</p>
            <h2 className="text-xl font-bold leading-tight mt-0.5">{module.title}</h2>
            <p className="text-xs text-white/70 mt-1">{module.lessons.length} lessons</p>
          </div>
        </div>
        <div className="px-5 py-3">
          <p className="text-xs text-slate-500 mb-4">{MODULE_DESC[index]}</p>
          {module.lessons.map((lesson, li) => {
            const Ic = TYPE_ICON[lesson.type] || BookOpen;
            const uuid = LESSON_UUID[lesson.id] || lesson.id;
            const isDone = done.includes(uuid);
            return (
              <Link key={lesson.id} href={lessonUrlById(lesson.id)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                  isDone ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                }`}>
                  {isDone ? <Play className="w-3.5 h-3.5" /> : li + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${isDone ? 'text-slate-400' : 'text-slate-900'}`}>{lesson.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Ic className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] text-slate-400">{TYPE_LABEL[lesson.type]}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */

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
  const [showVideo, setShowVideo] = useState(false);
  const total = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const done = completedLessonIds.length;
  const next = useMemo(() => findNext(course.modules, completedLessonIds), [course.modules, completedLessonIds]);
  const continueUrl = lastLessonId ? lessonUrl(lastLessonId) : next ? lessonUrl(next.lessonId) : lessonUrl(FIRST_LESSON_ID);
  const allDone = done >= total && total > 0;

  return (
    <div className="min-h-screen bg-white">

      {/* ═══ HERO ═══ */}
      <div className="relative h-[280px] md:h-[340px]">
        <Image src="/images/trades/hero-program-hvac.jpg" alt="HVAC technician" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-5xl mx-auto px-6 pb-6 w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{course.title}</h1>
            <p className="text-white/60 text-sm mt-1">{course.modules.length} modules · {total} lessons · EPA 608 · OSHA 30 · CPR</p>
            <div className="mt-4 max-w-sm">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>{done}/{total} lessons</span>
                <span className="font-bold text-white">{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              {!allDone && (
                <Link href={continueUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition text-sm shadow-lg">
                  <Play className="w-4 h-4" /> {done > 0 ? 'Continue' : 'Start Course'}
                </Link>
              )}
              {next && !allDone && (
                <p className="text-xs text-white/50 hidden md:block">Next: <span className="text-white/80">{next.title}</span></p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ═══ COURSE OVERVIEW ═══ */}
        <div className="mb-10 grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Duration', value: '20 Weeks', sub: 'Full-time program' },
            { label: 'Credentials', value: '3 Certs', sub: 'EPA 608 · OSHA 30 · CPR' },
            { label: 'Lessons', value: `${total}`, sub: `${course.modules.length} modules` },
            { label: 'Format', value: 'Hybrid', sub: 'Online RTI + hands-on OJT' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ═══ ORIENTATION VIDEO ═══ */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Student Orientation</h2>
          <p className="text-sm text-slate-500 mb-3">Required before starting Module 1. Covers program structure, policies, rights, and support services.</p>
          <button onClick={() => setShowVideo(true)}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden group cursor-pointer border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all">
            <div className="relative aspect-video bg-slate-900">
              <Image src="/images/heroes-hq/success-hero.jpg" alt="Student orientation" fill className="object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 text-slate-900 ml-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="text-white font-semibold text-sm drop-shadow-lg">Student Orientation Video</p>
                  <p className="text-white/60 text-xs">Program overview, policies, FERPA rights, and next steps</p>
                </div>
                <span className="text-white/50 text-xs bg-black/40 px-2 py-1 rounded">10:32</span>
              </div>
            </div>
          </button>
        </div>

        {/* ═══ MODULES ═══ */}
        <h2 className="text-lg font-bold text-slate-900 mb-4">Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {course.modules.map((mod, i) => {
            const { total: mt, completed: mc, pct } = modProgress(mod, completedLessonIds);
            const isComplete = mc === mt && mt > 0;
            const vids = countType(mod.lessons, 'video');
            const quizzes = countType(mod.lessons, 'quiz');
            const labs = countType(mod.lessons, 'lab');

            return (
              <button key={mod.id} onClick={() => setOpenModule(i)}
                className="text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-200 group">
                <div className="relative h-40 overflow-hidden">
                  <Image src={MODULE_PHOTO[i]} alt={mod.title} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-sm font-bold text-slate-800 shadow">
                    {i + 1}
                  </div>
                  {isComplete && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full shadow uppercase tracking-wide">Done</div>
                  )}
                  {!isComplete && pct > 0 && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold rounded-full shadow">{pct}%</div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-sm leading-tight drop-shadow-lg">{mod.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{MODULE_DESC[i]}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-3">
                    <span>{mt} lessons</span>
                    {vids > 0 && <span className="flex items-center gap-1"><Video className="w-3 h-3" />{vids}</span>}
                    {quizzes > 0 && <span className="flex items-center gap-1"><ClipboardCheck className="w-3 h-3" />{quizzes}</span>}
                    {labs > 0 && <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" />{labs}</span>}
                  </div>
                  <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : pct > 0 ? 'bg-slate-800' : 'bg-slate-200'}`}
                      style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-400">{mc}/{mt}</span>
                    <span className="text-[11px] font-semibold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Open <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orientation video player */}
      {showVideo && (
        <VideoPlayer src="/videos/orientation-full.mp4" onClose={() => setShowVideo(false)} />
      )}

      {/* Lesson Drawer */}
      {openModule !== null && (
        <LessonDrawer module={course.modules[openModule]} index={openModule} done={completedLessonIds} onClose={() => setOpenModule(null)} />
      )}
    </div>
  );
}
