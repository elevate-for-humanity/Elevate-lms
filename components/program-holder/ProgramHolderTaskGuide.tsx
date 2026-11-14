'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import { getHolderTaskLesson, type HolderTaskLesson } from '@/lib/program-holder/task-lessons';

/** One task at a time. Remounting on route change stops the previous tab's audio. */
export function ProgramHolderTaskGuide() {
  const pathname = usePathname();
  const lesson = getHolderTaskLesson(pathname);
  return lesson ? <TaskLesson key={lesson.path} lesson={lesson} /> : null;
}

export function TaskLesson({ lesson }: { lesson: HolderTaskLesson }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const { play, pause, resume, stop, isPaused, isLoading, error } = useNaturalVoice();
  const narration = `I'm PARIS. ${index === 0 ? `Your assignment in ${lesson.title}: ${lesson.assignment} ` : ''}Step ${index + 1}. ${lesson.steps[index]} ${index === 2 ? lesson.check : ''}`;

  useEffect(() => {
    if (!playing) return;
    void play(narration, {
      style: 'instructor',
      onEnded: () => {
        if (index < 2) setIndex((current) => current + 1);
        else {
          setPlaying(false);
          setFinished(true);
        }
      },
      onError: () => setPlaying(false),
    });
    return stop;
  }, [playing, index, narration, play, stop]);

  function chooseSlide(next: number) {
    stop();
    setPlaying(false);
    setFinished(false);
    setIndex(next);
  }

  return (
    <section
      aria-label={`${lesson.title} assignment and PARIS guide`}
      className="mx-auto mb-6 max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="grid sm:grid-cols-[minmax(0,1fr)_40%]">
        <div className="p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-widest text-blue-800">
            Your assignment · {lesson.title}
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950">
            {lesson.assignment}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`paris-lesson-${lesson.path.replaceAll('/', '-')}`}
              onClick={() => {
                if (open) {
                  stop();
                  setPlaying(false);
                } else {
                  setIndex(0);
                  setFinished(false);
                  setPlaying(true);
                }
                setOpen((value) => !value);
              }}
              className="min-h-12 rounded-xl bg-blue-800 px-4 py-3 font-bold text-white"
            >
              {open ? 'Close PARIS lesson' : 'Watch PARIS show me'}
            </button>
            <a
              href="#holder-task-tools"
              className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-900"
            >
              Start assignment ↓
            </a>
          </div>
        </div>
        <div className="relative min-h-40 sm:min-h-56">
          <Image
            src={`/images/pages/${lesson.image}`}
            alt={lesson.imageAlt}
            fill
            sizes="(min-width: 640px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
      {open && (
        <div
          id={`paris-lesson-${lesson.path.replaceAll('/', '-')}`}
          className="border-t border-slate-200 bg-slate-950 p-5 text-white sm:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-blue-200">PARIS guides you · Step {index + 1} of 3</p>
            <span className="text-sm text-slate-300">{lesson.title}</span>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-[1fr_1.1fr]">
            <div>
              <div className="relative mb-4 aspect-video overflow-hidden rounded-xl">
                <Image
                  key={index}
                  src={`/images/pages/${lesson.scenes?.[index] || lesson.image}`}
                  alt={lesson.imageAlt}
                  fill
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <ol aria-label="Assignment steps" className="space-y-3">
                {lesson.steps.map((step, position) => (
                  <li
                    key={step}
                    aria-current={index === position ? 'step' : undefined}
                    className={`flex gap-3 rounded-xl border p-4 ${index === position ? 'border-blue-300 bg-blue-900/60' : 'border-slate-700 text-slate-300'}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-black text-blue-900">
                      {position + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl bg-white p-5 text-slate-950">
              <p className="text-xs font-black uppercase tracking-widest text-blue-800">
                {['Find the right record', 'Do the work', 'Check what saved'][index]}
              </p>
              <h3 className="mt-3 text-xl font-black">{lesson.steps[index]}</h3>
              <p className="mt-4 text-base leading-7" aria-label="PARIS narration captions">
                {narration}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                if (playing && !isPaused) pause();
                else if (isPaused) void resume();
                else {
                  setFinished(false);
                  setPlaying(true);
                }
              }}
              className="min-h-12 rounded-xl bg-white px-4 py-3 font-bold text-blue-950 disabled:opacity-60"
            >
              {isLoading
                ? 'Preparing PARIS…'
                : playing && !isPaused
                  ? 'Pause PARIS'
                  : isPaused
                    ? 'Resume PARIS'
                    : finished
                      ? 'Replay this step'
                      : 'Play PARIS narration'}
            </button>
            <button
              type="button"
              disabled={index === 0}
              onClick={() => chooseSlide(index - 1)}
              className="min-h-12 rounded-xl border border-slate-500 px-4 py-3 font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => chooseSlide(index === 2 ? 0 : index + 1)}
              className="min-h-12 rounded-xl border border-slate-500 px-4 py-3 font-bold"
            >
              {index === 2 ? 'Restart slides' : 'Next step'}
            </button>
          </div>
          {error && (
            <p role="status" className="mt-4 rounded-xl bg-amber-100 p-3 text-amber-950">
              PARIS audio is unavailable. Use Next step and read the captions, or retry narration.
            </p>
          )}
          {finished && !error && (
            <p role="status" className="mt-4 font-bold text-blue-100">
              Now complete the assignment using the tools below.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
