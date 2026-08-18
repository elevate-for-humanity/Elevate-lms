'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';

export type TeachingSlide = { title: string; narration: string };

interface Props {
  courseTitle: string;
  lessonTitle: string;
  instructorName: string;
  instructorImage: string;
  slides: TeachingSlide[];
}

export default function AITeachingPlayer({
  courseTitle,
  lessonTitle,
  instructorName,
  instructorImage,
  slides,
}: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const current = slides[index] ?? { title: lessonTitle, narration: lessonTitle };
  const progress = Math.round(((index + 1) / Math.max(slides.length, 1)) * 100);

  const supported = useMemo(() => typeof window !== 'undefined' && 'speechSynthesis' in window, []);

  function stop() {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setPlaying(false);
  }

  function speak(slideIndex = index) {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const slide = slides[slideIndex] ?? current;
    const utterance = new SpeechSynthesisUtterance(`${slide.title}. ${slide.narration}`);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((voice) => /aria|jenny|samantha|female/i.test(voice.name)) ?? voices[0] ?? null;
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onend = () => {
      if (slideIndex < slides.length - 1) {
        const nextIndex = slideIndex + 1;
        setIndex(nextIndex);
        window.setTimeout(() => speak(nextIndex), 250);
      } else {
        setPlaying(false);
      }
    };
    utterance.onerror = () => setPlaying(false);
    utteranceRef.current = utterance;
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  function move(nextIndex: number) {
    stop();
    setIndex(Math.min(Math.max(nextIndex, 0), slides.length - 1));
  }

  useEffect(() => stop, []);

  return (
    <section className="overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-cyan-50 text-slate-950 shadow-xl">
      <div className="h-2 bg-orange-100">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid min-h-[430px] lg:grid-cols-[0.78fr_1.22fr]">
        <div className="relative flex min-h-[300px] items-end overflow-hidden bg-gradient-to-b from-amber-200 to-rose-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={instructorImage}
            alt={`${instructorName}, AI course instructor`}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-950/80 via-transparent to-transparent" />
          <div className="relative z-10 m-5 rounded-2xl bg-white/95 p-5 text-slate-950 shadow-lg backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
              AI instructor
            </p>
            <h2 className="mt-1 text-2xl font-black">{instructorName}</h2>
            <p className="text-sm font-semibold text-slate-600">Elevate course instructor</p>
          </div>
        </div>

        <div className="flex flex-col justify-between p-7 sm:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
              {courseTitle}
            </p>
            <p className="mt-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-sm font-bold text-cyan-800">
              Slide {index + 1} of {slides.length}
            </p>
            <h3 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{current.title}</h3>
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-lg font-medium leading-8 text-slate-800">
              {current.narration}
            </p>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => move(index - 1)}
              disabled={index === 0}
              aria-label="Previous slide"
              className="rounded-full border border-orange-200 bg-white p-3 text-orange-700 shadow-sm hover:bg-orange-50 disabled:opacity-35"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => (playing ? stop() : speak())}
              disabled={!supported}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-black text-white shadow-md hover:from-orange-600 hover:to-pink-600 disabled:opacity-50"
            >
              {playing ? <Pause /> : <Play />} {playing ? 'Pause instructor' : 'Play lesson'}
            </button>
            <button
              type="button"
              onClick={() => {
                stop();
                setIndex(0);
              }}
              aria-label="Restart lesson"
              className="rounded-full border border-cyan-200 bg-white p-3 text-cyan-700 shadow-sm hover:bg-cyan-50"
            >
              <RotateCcw />
            </button>
            <button
              type="button"
              onClick={() => move(index + 1)}
              disabled={index >= slides.length - 1}
              aria-label="Next slide"
              className="rounded-full border border-orange-200 bg-white p-3 text-orange-700 shadow-sm hover:bg-orange-50 disabled:opacity-35"
            >
              <ChevronRight />
            </button>
            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-2 text-xs font-bold text-cyan-900">
              <Volume2 className="h-4 w-4" /> Narration and captions
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
