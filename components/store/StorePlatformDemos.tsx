'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { PLATFORM_DEMO_VIDEOS } from './platform-demo-videos';

const mediaRoot = '/videos/store-platform';
const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

/** On-demand narrated product tours; hands-on role demos remain separate. */
export default function StorePlatformDemos() {
  const [selected, setSelected] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const demo = PLATFORM_DEMO_VIDEOS[selected];

  const selectDemo = (index: number) => {
    player.current?.pause();
    setMediaError(false);
    setSelected(index);
  };

  return (
    <section
      id="platform-demos"
      aria-labelledby="platform-demos-heading"
      className="scroll-mt-24 border-b border-slate-200 bg-white px-4 py-12 text-slate-950 sm:px-6 sm:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">
            Watch. Learn. Choose your next step.
          </p>
          <h2 id="platform-demos-heading" className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            See what Elevate can do for you.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-700">
            Six short visual tours, narrated by PARIS, explain the website builder, AI team,
            subscriptions, course creation, connected platform and store. Choose a subject, then press Play.
          </p>
        </div>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[1.55fr_1fr]">
          <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <video
              key={demo.slug}
              ref={player}
              controls
              playsInline
              preload="none"
              poster={`${mediaRoot}/${demo.slug}.jpg`}
              aria-label={`${demo.title} — narrated product tour`}
              aria-describedby="platform-demo-disclosure"
              className="aspect-video w-full bg-slate-950 object-contain"
              onError={() => setMediaError(true)}
            >
              <source src={`${mediaRoot}/${demo.slug}.mp4`} type="video/mp4" />
              <track
                kind="captions"
                src={`${mediaRoot}/${demo.slug}.vtt`}
                srcLang="en"
                label="English (estimated timing)"
                default
              />
              Your browser cannot play this video. Use the video download or transcript below.
            </video>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-red-700">
                PARIS AI presenter · {formatDuration(demo.duration)}
              </p>
              <h3 className="mt-2 text-2xl font-black" aria-live="polite">{demo.title}</h3>
              {mediaError && (
                <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                  This video could not load. Try the video download or read the transcript below.
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link href={demo.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-red-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-red-800">
                  {demo.cta}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href={`${mediaRoot}/${demo.slug}.mp4`} download className="inline-flex min-h-11 items-center text-sm font-bold text-slate-700 underline underline-offset-4">Download video</a>
                <a href={`${mediaRoot}/${demo.slug}-transcript.txt`} download className="inline-flex min-h-11 items-center text-sm font-bold text-slate-700 underline underline-offset-4">Download transcript</a>
              </div>
              <details key={`${demo.slug}-transcript`} className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer font-bold">Read this tour’s transcript</summary>
                <p className="mt-3 text-sm leading-7 text-slate-700">{demo.script}</p>
              </details>
            </div>
          </article>

          <div role="group" aria-label="Choose a product video" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {PLATFORM_DEMO_VIDEOS.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                aria-pressed={selected === index}
                aria-label={`Watch ${item.title}`}
                onClick={() => selectDemo(index)}
                className={`flex min-h-24 min-w-0 items-center gap-3 rounded-xl border-2 p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red-700 ${selected === index ? 'border-brand-red-700 bg-brand-red-50' : 'border-slate-200 bg-white hover:border-brand-red-300'}`}
              >
                <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={`${mediaRoot}/${item.slug}.jpg`} alt="" fill sizes="112px" className="object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-sm font-black leading-5">{item.title}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-600">
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    {formatDuration(item.duration)} · {selected === index ? 'Selected' : 'Watch tour'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <p id="platform-demo-disclosure" className="mt-5 max-w-4xl text-xs leading-6 text-slate-600">
          PARIS is an AI presenter. These narrated explainers use illustrative pictures and examples;
          they are not recordings of live customer workflows. Caption timing is estimated; full transcripts
          are provided. Prices were reviewed October 25, 2026. Check current plans, included features,
          usage limits and terms before buying.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-brand-red-700">
          <Link href="#role-demos" className="underline underline-offset-4">Try a hands-on role demo</Link>
          <Link href="#website-builder-commercial" className="underline underline-offset-4">Try the interactive website builder</Link>
          <Link href="/store/plans" className="underline underline-offset-4">Compare current plans</Link>
        </div>
      </div>
    </section>
  );
}
