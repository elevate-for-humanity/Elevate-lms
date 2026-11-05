'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import orientations from '@/lib/orientation/dashboard-orientations.json';

export type OrientationAudience = keyof typeof orientations;

/** Shared visual guide. The film and slides teach navigation; neither changes
 * enrollment, attendance, signatures, or course-completion records. */
export default function VisualDashboardOrientation({
  audience,
  compact = false,
}: {
  audience: OrientationAudience;
  compact?: boolean;
}) {
  const guide = orientations[audience];
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<'slides' | 'video'>('slides');
  const [speaking, setSpeaking] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [livePortal, setLivePortal] = useState(false);
  const speechGeneration = useRef(0);
  const voice = useNaturalVoice();
  const { stop: stopVoice, play: playVoice } = voice;
  function stopNarration() {
    speechGeneration.current += 1;
    stopVoice();
    setSpeaking(false);
    setActiveStep(null);
  }
  function narrateTopic() {
    stopNarration();
    const generation = speechGeneration.current;
    const current = guide.slides[Math.min(index, guide.slides.length - 1)];
    const segments = [current.title, ...current.points, current.narration];
    setSpeaking(true);
    const speak = async (position: number) => {
      if (generation !== speechGeneration.current) return;
      if (position >= segments.length) {
        setSpeaking(false);
        setActiveStep(null);
        return;
      }
      setActiveStep(position > 0 && position <= current.points.length ? position - 1 : null);
      await playVoice(segments[position], {
        style: 'instructor',
        onEnded: () => { void speak(position + 1); },
        onError: () => {
          if (generation === speechGeneration.current) {
            setSpeaking(false);
            setActiveStep(null);
          }
        },
      });
    };
    void speak(0);
  }
  useEffect(() => { stopNarration(); setLivePortal(false); }, [index, audience, mode]);
  useEffect(() => () => { speechGeneration.current += 1; stopVoice(); }, [stopVoice]);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    setIndex(0);
    setUnavailable(false);
    setMode('slides');
  }, [audience]);
  const slide = guide.slides[Math.min(index, guide.slides.length - 1)];
  const primary = guide.slides.slice(0, 3);
  // Interactive actions are independent of the already published film and captions.
  const planTraining = audience === 'host-shop' && slide.href === '/host-shop/dashboard/reports';
  const actionHref = planTraining ? '/host-shop/dashboard/schedule' : slide.href;
  const actionTitle = planTraining ? 'Open training schedule' : slide.action;
  return (
    <section
      id={`orientation-${audience}`}
      className="min-w-0 space-y-4"
      aria-label={`${guide.title} orientation`}
    >
      {!compact && (
        <div className="overflow-hidden rounded-3xl bg-neutral-950 text-white">
          <div className="relative h-40 sm:h-48">
            <Image src={guide.hero} alt="" fill sizes="100vw" className="object-cover object-top" />
          </div>

          <div className="max-w-3xl p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-200">
              Elevate · Start here
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{guide.title}</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/90">{guide.subtitle}</p>
            <a
              href={`#tour-${audience}`}
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-3 font-bold text-neutral-950"
            >
              Explore your orientation
            </a>
          </div>
        </div>
      )}
      <div className="grid min-w-0 gap-3 sm:grid-cols-3" aria-label="Start with these steps">
        {primary.map((item, i) => (
          <button
            key={item.title}
            type="button"
            onClick={() => {
              setIndex(i);
              setMode('slides');
              document
                .getElementById(`tour-${audience}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex min-w-0 gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left text-neutral-950 shadow-sm hover:border-amber-600"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 font-bold text-amber-900">
              {i + 1}
            </span>
            <span className="min-w-0">
              <strong className="block text-sm leading-5">{item.title}</strong>
              <span className="mt-1 block text-xs text-stone-600">See the steps →</span>
            </span>
          </button>
        ))}
      </div>
      <div
        key={audience}
        id={`tour-${audience}`}
        className="scroll-mt-24 overflow-hidden rounded-3xl border border-stone-200 bg-neutral-950 text-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 p-4">
          <p className="font-bold">Your visual orientation</p>
          <div className="flex gap-2" aria-label="Orientation format">
            <button
              type="button"
              aria-pressed={mode === 'slides'}
              onClick={() => setMode('slides')}
              className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-bold ${mode === 'slides' ? 'bg-white text-black' : 'border-white/40'}`}
            >
              Explore slides
            </button>
            <button
              type="button"
              aria-pressed={mode === 'video'}
              onClick={() => setMode('video')}
              className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-bold ${mode === 'video' ? 'bg-white text-black' : 'border-white/40'}`}
            >
              Watch narrated video
            </button>
          </div>
        </div>
        {mode === 'video' ? (
          <div className="p-3 sm:p-5">
            {!unavailable ? (
              <video
                key={audience}
                controls
                playsInline
                preload="metadata"
                aria-label={audience === 'host-shop' ? 'Host Shop dashboard tour with a salon example' : guide.title}
                poster={guide.hero}
                className="aspect-video w-full rounded-xl bg-black"
                onError={() => setUnavailable(true)}
              >
                <source src={`/api/orientation/media/${audience}?format=mp4`} type="video/mp4" />
                <track
                  kind="captions"
                  src={`/api/orientation/media/${audience}?format=vtt`}
                  srcLang="en"
                  label="English"
                  default
                />
                Your browser does not support video. Use Explore slides for the full guide.
              </video>
            ) : (
              <div role="status" className="rounded-xl bg-white/10 p-5">
                <p>
                  This video could not load. Open the picture guide below or try the video again.
                </p>
                <button
                  onClick={() => setMode('slides')}
                  className="mt-3 min-h-11 rounded-lg bg-white px-4 py-2 font-bold text-black"
                >
                  Open the visual guide
                </button>
                <button
                  onClick={() => setUnavailable(false)}
                  className="ml-3 mt-3 min-h-11 rounded-lg border border-white/40 px-4 py-2 font-bold"
                >
                  Retry video
                </button>
              </div>
            )}
            <p className="mt-3 text-sm text-stone-300">
              {audience === 'host-shop' ? 'This dashboard tour uses a salon as its example. ' : ''}Press play for a guided tour. You can pause, replay, or turn on captions.
            </p>
          </div>
        ) : (
          <>
            <div className="grid min-w-0 md:grid-cols-2" aria-live="polite" aria-atomic="true">
              <div className="relative aspect-[16/10] min-w-0 bg-neutral-900 md:aspect-auto md:min-h-80">
                {livePortal ? <iframe title={`Live portal: ${slide.title}`} src={actionHref} sandbox="allow-scripts allow-same-origin" className="absolute inset-0 h-full w-full border-0 bg-white pointer-events-none" /> : <Image
                  key={slide.image}
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                  className="object-contain p-3"
                />}
              </div>
              <div className="min-w-0 p-5 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  Topic {index + 1} of {guide.slides.length}
                </p>
                <h3 className="mt-3 text-2xl font-black leading-tight">{slide.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={speaking ? stopNarration : narrateTopic} className="min-h-11 rounded-lg bg-white px-4 py-2 font-bold text-black">{speaking ? 'Stop narration' : 'Narrate this topic step by step'}</button>
                  <button type="button" onClick={() => setLivePortal(value => !value)} className="min-h-11 rounded-lg border border-white/40 px-4 py-2 font-bold">{livePortal ? 'Show reference picture' : 'Show actual portal'}</button>
                </div>
                <p className="mt-3 text-sm text-stone-300">Listen as each instruction is highlighted. The portal preview shows your signed-in view; use the action link to work in the full portal. No training credit is awarded by this guide.</p>
                <ol className="mt-5 space-y-4">
                  {slide.points.map((point, i) => (
                    <li key={point} aria-current={activeStep === i ? 'step' : undefined} className={`flex gap-3 rounded-lg p-2 text-base leading-6 ${activeStep === i ? 'bg-amber-100 text-neutral-950' : ''}`}>
                      <span className="font-bold text-amber-200">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 break-words">{point}</span>
                    </li>
                  ))}
                </ol>
                <Link
                  href={actionHref}
                  className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-amber-100 px-4 py-3 text-sm font-bold text-neutral-950"
                >
                  {actionTitle} →
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-white/15 p-4">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
                className="min-h-11 rounded-lg border border-white/40 px-4 py-2 font-bold disabled:opacity-40"
              >
                Previous
              </button>
              <select
                aria-label="Choose an orientation topic"
                value={index}
                onChange={(e) => setIndex(Number(e.target.value))}
                className="min-h-11 min-w-0 flex-1 rounded-lg bg-white p-2 text-sm text-neutral-950"
              >
                {guide.slides.map((item, i) => (
                  <option key={item.title} value={i}>
                    {i + 1}. {item.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % guide.slides.length)}
                className="min-h-11 rounded-lg bg-white px-4 py-2 font-bold text-black"
              >
                {index === guide.slides.length - 1 ? 'Restart' : 'Next'}
              </button>
            </div>
            <details className="border-t border-white/15 p-4">
              <summary className="min-h-11 cursor-pointer font-bold text-amber-100">
                Read the detailed instructions for this topic
              </summary>
              <p
                tabIndex={0}
                role="region"
                aria-label="Orientation transcript"
                className="mt-3 max-h-64 max-w-4xl overflow-y-auto whitespace-pre-line text-base leading-8 text-stone-200"
              >
                {slide.narration}
              </p>
            </details>
          </>
        )}
      </div>
    </section>
  );
}
