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
  '/images/programs-hq/hvac-technician.jpg',                    // 1  Orientation — HVAC technician at work
  '/images/hvac/hvac-installation.jpg',                        // 2  Fundamentals — HVAC system install
  '/images/trades/hero-program-electrical.jpg',                // 3  Electrical — wiring/panels
  '/images/hvac/hvac-service-tech.jpg',                        // 4  Heating — service technician
  '/images/hvac/hvac-commercial.jpg',                          // 5  Cooling — commercial system
  '/images/trades/program-hvac-overview.jpg',                  // 6  EPA Core — HVAC overview
  '/images/hvac/hvac-tools-equipment.jpg',                     // 7  EPA Type I — tools & testing
  '/images/trades/program-building-technology.jpg',            // 8  EPA Type II — building systems
  '/images/trades/program-building-construction.jpg',          // 9  EPA Type III — construction/controls
  '/images/hvac/hvac-advisor-meeting.jpg',                     // 10 EPA Final — advisor review
  '/images/trades/program-welding-training.jpg',               // 11 Refrigerant — brazing/piping
  '/images/trades/program-construction-training.jpg',          // 12 Installation — hands-on install
  '/images/trades/program-electrical-training.jpg',            // 13 Troubleshooting — electrical diagnostics
  '/images/programs-hq/skilled-trades-hero.jpg',               // 14 OSHA — safety on the job site
  '/images/trades/hero-program-hvac.jpg',                      // 15 CPR/First Aid — HVAC field readiness
  '/images/heroes-hq/career-services-hero.jpg',                // 16 Career — professional development
];

const MODULE_DESC: string[] = [
  'Program structure, attendance policy, FERPA rights, support services, and career outlook for HVAC technicians in Indiana.',
  'How heating, ventilation, and air conditioning systems work together. Components, airflow principles, BTU calculations, and system safety.',
  'AC/DC circuits, wiring diagrams, multimeter operation, Ohm\'s Law, and NEC electrical safety standards for HVAC applications.',
  'Gas and oil furnaces, heat pumps, gas valve operation, ignition systems, and systematic heating diagnostics.',
  'The refrigeration cycle, compressor types, metering devices, evaporators, condensers, and superheat/subcooling measurements.',
  'EPA 608 Core exam prep — ozone depletion, Clean Air Act, refrigerant recovery requirements, and safety procedures.',
  'EPA 608 Type I — small appliance systems under 5 lbs of refrigerant. Recovery techniques and self-contained equipment.',
  'EPA 608 Type II — high-pressure systems. Leak detection, evacuation procedures, system charging, and recovery equipment.',
  'EPA 608 Type III — low-pressure systems. Centrifugal chillers, purge units, and large commercial equipment procedures.',
  'Full-length 100-question EPA 608 Universal practice exam. Timed, scored, with detailed answer explanations.',
  'Refrigerant identification, handling procedures, pressure-temperature relationships, and diagnostic techniques.',
  'Equipment sizing, ductwork design, refrigerant line sets, brazing, system startup, and commissioning procedures.',
  'Systematic troubleshooting methodology, service call management, customer communication, and documentation.',
  'OSHA 30-Hour Construction — fall protection, electrical safety, scaffolding, HazCom, PPE, and confined spaces.',
  'American Red Cross CPR/First Aid/AED certification plus Rise Up customer service and workplace readiness.',
  'Resume writing, interview techniques, employer introductions, and job placement support with local HVAC contractors.',
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
      <div className="relative h-[320px] md:h-[400px]">
        <Image src="/images/trades/program-hvac-technician.jpg" alt="HVAC technician working on commercial unit" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-5xl mx-auto px-6 pb-8 w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-amber-500/90 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">DOL Registered</span>
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur text-white text-[10px] font-bold rounded-full uppercase tracking-wider">ETPL Approved</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">{course.title}</h1>
            <p className="text-white/70 text-sm mt-2 max-w-xl">20-week program preparing you for EPA 608 Universal Certification, OSHA 30-Hour, and CPR/First Aid — with direct employer placement in Indianapolis.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {['EPA 608 Universal', 'OSHA 30-Hour', 'CPR/First Aid'].map((cert) => (
                <span key={cert} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur border border-white/20 text-white text-xs font-semibold rounded-full">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {cert}
                </span>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-4">
              {!allDone && (
                <Link href={continueUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition text-sm shadow-xl hover:shadow-2xl">
                  <Play className="w-4 h-4" /> {done > 0 ? 'Continue Learning' : 'Start Course'}
                </Link>
              )}
              {allDone && (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl text-sm shadow-xl">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Course Complete
                </div>
              )}
              {next && !allDone && (
                <p className="text-xs text-white/50 hidden md:block">Up next: <span className="text-white/80 font-medium">{next.title}</span></p>
              )}
            </div>
            {(done > 0 || progressPercent > 0) && (
              <div className="mt-4 max-w-xs">
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>{done}/{total} lessons</span>
                  <span className="font-bold text-white">{progressPercent}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ═══ COURSE OVERVIEW ═══ */}
        <div className="mb-10 grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Duration', value: '20 Weeks', sub: 'Full-time · Mon–Fri', color: 'bg-brand-blue-50 border-brand-blue-200', accent: 'text-brand-blue-600' },
            { label: 'Credentials', value: '3 Certs', sub: 'EPA 608 · OSHA 30 · CPR', color: 'bg-amber-50 border-amber-200', accent: 'text-amber-600' },
            { label: 'Lessons', value: `${total}`, sub: `${course.modules.length} weekly modules`, color: 'bg-emerald-50 border-emerald-200', accent: 'text-emerald-600' },
            { label: 'Format', value: 'Hybrid', sub: 'Online RTI + hands-on OJT', color: 'bg-purple-50 border-purple-200', accent: 'text-purple-600' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} border rounded-xl p-4 text-center`}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-extrabold mt-1 ${stat.accent}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ═══ WHAT YOU'LL EARN ═══ */}
        <div className="mb-10 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-bold text-white mb-1">Industry Credentials Earned</h2>
          <p className="text-sm text-slate-400 mb-5">Upon successful completion, you will hold three nationally recognized certifications.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'EPA 608 Universal', issuer: 'U.S. Environmental Protection Agency', desc: 'Required to purchase and handle refrigerants. Covers all equipment types.' },
              { name: 'OSHA 30-Hour Construction', issuer: 'Occupational Safety & Health Administration', desc: 'Industry-standard safety certification for construction and trades workers.' },
              { name: 'CPR/First Aid/AED', issuer: 'American Red Cross', desc: 'Emergency response certification valid for 2 years. Required by most employers.' },
            ].map((cred) => (
              <div key={cred.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-white font-bold text-sm">{cred.name}</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">{cred.issuer}</p>
                <p className="text-slate-300 text-xs mt-2 leading-relaxed">{cred.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ ORIENTATION VIDEO ═══ */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Student Orientation</h2>
          <p className="text-sm text-slate-500 mb-3">Required before starting Module 1. Covers program structure, policies, rights, and support services.</p>
          <button onClick={() => setShowVideo(true)}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden group cursor-pointer border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all">
            <div className="relative aspect-video bg-slate-900">
              <Image src="/images/programs-hq/training-classroom.jpg" alt="Student orientation session" fill className="object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
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

        {/* ═══ CAREER OUTCOMES ═══ */}
        <div className="mb-10 grid sm:grid-cols-3 gap-4">
          {[
            { stat: '$51,390', label: 'Median Salary', sub: 'BLS 2024 for HVAC technicians' },
            { stat: '6%', label: 'Job Growth', sub: 'Projected through 2032' },
            { stat: '90%+', label: 'Placement Rate', sub: 'Graduates placed within 90 days' },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-5 text-center">
              <p className="text-3xl font-extrabold text-slate-900">{item.stat}</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{item.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* ═══ MODULES ═══ */}
        <h2 className="text-lg font-bold text-slate-900 mb-1">Weekly Modules</h2>
        <p className="text-sm text-slate-500 mb-5">Click any module to see its lessons. Complete them in order to unlock the next.</p>
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
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{MODULE_DESC[i]}</p>
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
