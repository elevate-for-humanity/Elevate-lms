'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, BookOpen, CheckCircle, Clock, Play } from 'lucide-react';
import { TalkingDemoGuide } from '@/components/store/TalkingDemoGuide';

const courses = [
  { id: 'barber', title: 'Barber Fundamentals', progress: 65, duration: '15 weeks' },
  { id: 'hvac', title: 'HVAC Technician', progress: 30, duration: '12 weeks' },
];

const demoSteps = [
  {
    title: 'Open the learner workspace',
    narration: 'Students see a focused dashboard with their assigned courses, progress and next actions instead of navigating an administrative system.',
    actionLabel: 'Learner dashboard',
  },
  {
    title: 'Continue a course',
    narration: 'Open a course to see lesson progression. Course content, knowledge checks and completion status stay connected to the learner record.',
    actionLabel: 'Open a course',
  },
  {
    title: 'Complete learning activities',
    narration: 'Learners can move through lessons and knowledge checks while the platform tracks progress for instructors and administrators.',
    actionLabel: 'Complete a lesson',
  },
  {
    title: 'Earn and retain credentials',
    narration: 'Completion data can feed certificates and credential records so learners can demonstrate what they completed.',
    actionLabel: 'Credentials',
  },
];

export default function StudentDemoPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState('');
  const selected = courses.find((course) => course.id === selectedCourse);

  const startLesson = (lesson: number) => {
    const key = `${selectedCourse}-${lesson}`;
    setCompleted((current) => ({ ...current, [key]: true }));
    setNotice(`Sample lesson ${lesson} completed in demo mode`);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const guideStep = (index: number) => {
    if (index >= 1 && !selectedCourse) setSelectedCourse('barber');
    if (index === 0) setSelectedCourse(null);
    if (index === 2) setNotice('Try any lesson below. Completion is local to this demo.');
    if (index === 3) setNotice('Credential records are demonstrated with sample data only.');
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 bg-blue-700 text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/store/demos" className="rounded-lg p-2 hover:bg-white/10" aria-label="Back to demo center"><ArrowLeft className="h-5 w-5" /></Link>
            <div><p className="text-xs font-bold uppercase tracking-wider text-blue-200">Sample data · Interactive demo</p><h1 className="font-black">Student Portal</h1></div>
          </div>
          <Link href="/store/trial" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-700">Start Trial</Link>
        </div>
      </header>
      {notice && <div className="fixed right-4 top-24 z-50 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}

      <div className="mx-auto max-w-6xl px-4 py-8">
        <TalkingDemoGuide productName="Elevate Student Portal" steps={demoSteps} onStepChange={guideStep} />

        <section className="mb-8 mt-6 rounded-2xl border border-slate-200 bg-white p-7">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 font-black text-blue-700">JD</div><div><h2 className="text-2xl font-black">Demo Learner</h2><p className="text-slate-500">Interactive sample account</p></div></div>
        </section>

        {!selected ? (
          <section>
            <h2 className="mb-5 text-2xl font-black text-slate-950">My sample courses</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {courses.map((course) => (
                <article key={course.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div><BookOpen className="h-6 w-6 text-blue-600" /><h3 className="mt-3 text-xl font-black">{course.title}</h3></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{course.progress}%</span></div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Clock className="h-4 w-4" />{course.duration}</div>
                  <div className="mt-4 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${course.progress}%` }} /></div>
                  <button onClick={() => setSelectedCourse(course.id)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 font-bold text-white"><Play className="h-4 w-4" />Continue learning</button>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-black">{selected.title}</h2><p className="text-sm text-slate-500">Five interactive sample lessons</p></div><button onClick={() => setSelectedCourse(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold">Back to courses</button></div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
              <video
                className="aspect-[8/3] w-full bg-black object-cover"
                controls
                playsInline
                preload="metadata"
                aria-label={`${selected.title} sample lesson video`}
              >
                <source src="/videos/courses/elevate-esb-hero.mp4" type="video/mp4" />
                Your browser does not support HTML video. The lesson activities remain available below.
              </video>
              <p className="px-4 py-3 text-sm font-semibold text-slate-200">Sample Elevate lesson video · playback is optional and lesson controls remain accessible.</p>
            </div>
            <div className="mt-6 space-y-3">{[1,2,3,4,5].map((lesson) => { const done = completed[`${selected.id}-${lesson}`]; return <div key={lesson} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3">{done ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Play className="h-6 w-6 text-blue-600" />}<div><p className="font-bold">Lesson {lesson}: Sample learning activity</p><p className="text-sm text-slate-500">Lesson activity + knowledge check · demo only</p></div></div><button onClick={() => startLesson(lesson)} className={`rounded-lg px-4 py-2 text-sm font-bold ${done ? 'bg-green-100 text-green-800' : 'bg-blue-700 text-white'}`}>{done ? 'Replay sample' : 'Start lesson'}</button></div>; })}</div>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 text-center"><Award className="mx-auto h-10 w-10 text-amber-500" /><h2 className="mt-3 text-xl font-black">Ready for the real learner experience?</h2><p className="mx-auto mt-2 max-w-xl text-slate-600">Start a workspace and use the LMS with your own courses, students, progress and credentials.</p><Link href="/store/trial" className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-black text-white">Start 14-Day Trial</Link></section>
      </div>
    </main>
  );
}
