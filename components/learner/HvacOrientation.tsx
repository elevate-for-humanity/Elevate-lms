'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import slides from '@/lib/learner/hvac-orientation.json';

export default function HvacOrientation() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (current >= slides.length - 1) setPlaying(false);
      else setCurrent(current + 1);
    }, 18000);
    return () => clearTimeout(timer);
  }, [playing, current]);
  const slide = slides[current]!;
  return (
    <section className="space-y-6" aria-label="HVAC dashboard orientation">
      <h2 className="text-2xl font-bold">HVAC program and dashboard orientation</h2>
      <div
        className="rounded-xl bg-slate-950 p-6 text-white sm:p-10"
        aria-label="Orientation slideshow"
      >
        <p>
          {current + 1} of {slides.length}: {slide.label}
        </p>
        <h3 className="my-4 text-2xl font-bold">{slide.title}</h3>
        <ul className="list-disc space-y-3 pl-6">
          {slide.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="min-h-11 rounded border px-4 py-2 disabled:opacity-50"
            disabled={current === 0}
            onClick={() => setCurrent((index) => index - 1)}
          >
            Previous
          </button>
          <button
            className="min-h-11 rounded border px-4 py-2"
            onClick={() => {
              if (current === slides.length - 1) setCurrent(0);
              setPlaying((value) => !value);
            }}
          >
            {playing ? 'Pause' : 'Play slideshow'}
          </button>
          <button
            className="min-h-11 rounded border px-4 py-2 disabled:opacity-50"
            disabled={current === slides.length - 1}
            onClick={() => setCurrent((index) => index + 1)}
          >
            Next
          </button>
        </div>
      </div>
      <p>Allow six minutes, or pause to complete each activity. The full text appears below.</p>
      <p>
        Four weeks online, followed by two weeks at the facility. Confirm calendar dates with staff.
      </p>
      <nav className="flex flex-wrap gap-4">
        <Link className="underline" href="/lms/attendance">
          Online study clock
        </Link>
        <Link className="underline" href="/lms/onboarding">
          Onboarding checklist
        </Link>
        <Link className="underline" href="/lms/courses">
          My Courses
        </Link>
        <Link className="underline" href="/lms/support">
          Get Help
        </Link>
      </nav>
      <p>
        Online clock instructions apply once the study clock appears on Attendance. Contact support
        if it is unavailable.
      </p>
      {slides.map((item, index) => (
        <article key={item.label} className="border-t border-slate-200 pt-5">
          <p className="text-sm text-slate-600">
            {index + 1}. {item.label}
          </p>
          <h3 className="text-xl font-bold">{item.title}</h3>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            {item.items.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
