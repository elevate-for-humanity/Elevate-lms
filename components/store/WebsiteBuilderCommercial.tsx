'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronRight,
  Globe2,
  LayoutTemplate,
  Mic,
  Monitor,
  Palette,
  Pause,
  Play,
  Rocket,
  Search,
  Send,
  Smartphone,
  Sparkles,
} from 'lucide-react';

const SCENES = [
  { start: 0, label: 'Describe the business' },
  { start: 8, label: 'Generate the first draft' },
  { start: 17, label: 'Edit with PARIS' },
  { start: 27, label: 'Change the brand' },
  { start: 38, label: 'Add conversion tools' },
  { start: 50, label: 'Preview every screen' },
  { start: 61, label: 'Publish' },
  { start: 72, label: 'Keep growing' },
] as const;

const QUICK_COMMANDS = [
  'Make the hero brighter',
  'Add online booking',
  'Rewrite my services',
  'Make it feel more premium',
];

function sceneFromTime(seconds: number) {
  let index = 0;
  for (let i = 0; i < SCENES.length; i += 1) {
    if (seconds >= SCENES[i].start) index = i;
  }
  return index;
}

function SitePreview({ scene }: { scene: number }) {
  const showGenerated = scene >= 1;
  const showBrandEdit = scene >= 3;
  const showBooking = scene >= 4;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <div className="ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
          <Globe2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">preview.elevate.site/harbor-home-health</span>
        </div>
      </div>

      {!showGenerated ? (
        <div className="grid min-h-[360px] place-items-center bg-gradient-to-br from-cyan-50 via-white to-rose-50 p-6 text-center">
          <div className="max-w-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red-100 text-brand-red-700">
              <LayoutTemplate className="h-7 w-7" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">Blank canvas avoided</p>
            <h4 className="mt-2 text-2xl font-black text-slate-950">Describe the business and PARIS starts the site.</h4>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">The buyer sees what they are building before they ever enter the full editor.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white">
          <div className={`relative overflow-hidden ${showBrandEdit ? 'bg-gradient-to-r from-cyan-50 via-white to-rose-50' : 'bg-gradient-to-r from-sky-50 to-cyan-50'}`}>
            <div className="grid min-h-[220px] gap-5 p-5 md:grid-cols-[1.05fr_0.95fr] md:items-center md:p-7">
              <div>
                <div className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-red-700 shadow-sm">
                  Indianapolis home healthcare
                </div>
                <h4 className="mt-4 text-3xl font-black leading-tight text-slate-950">
                  Compassionate care that keeps families moving forward.
                </h4>
                <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-700">
                  Skilled support, personal care, respite services, and simple online consultation requests.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" className="rounded-lg bg-brand-red-700 px-4 py-2 text-xs font-black text-white">Book a consultation</button>
                  <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-800">View services</button>
                </div>
              </div>
              <div className="relative min-h-[170px] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-lg">
                <Image
                  src="/images/pages/platform-page-12.webp"
                  alt="Website preview inside the Elevate Website Builder demo"
                  fill
                  sizes="(max-width: 768px) 90vw, 40vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {['Personal care', 'Respite support', 'Care coordination'].map((service) => (
              <div key={service} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="h-8 w-8 rounded-lg bg-cyan-100" />
                <div className="mt-3 text-xs font-black text-slate-900">{service}</div>
                <div className="mt-2 h-1.5 w-full rounded bg-slate-200" />
                <div className="mt-1.5 h-1.5 w-3/4 rounded bg-slate-200" />
              </div>
            ))}
          </div>

          {showBooking ? (
            <div className="mx-5 mb-5 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">New conversion block added</p>
                <p className="mt-1 text-sm font-black text-slate-950">Consultation booking is now on the homepage.</p>
              </div>
              <button type="button" className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white">Request appointment</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function BuilderWorkspace({ scene, setScene }: { scene: number; setScene: (scene: number) => void }) {
  const prompt =
    scene === 0
      ? 'Build a professional home-healthcare website in Indianapolis with services, booking, and a strong call to action.'
      : QUICK_COMMANDS[Math.min(Math.max(scene - 2, 0), QUICK_COMMANDS.length - 1)];

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-red-700 text-white">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">Elevate Website Builder</p>
            <p className="text-[11px] font-semibold text-emerald-700">Draft saved automatically</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setScene(5)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-50">
            <Monitor className="h-3.5 w-3.5" /> Preview
          </button>
          <button type="button" onClick={() => setScene(6)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-red-700 px-3 py-2 text-xs font-black text-white hover:bg-brand-red-800">
            <Rocket className="h-3.5 w-3.5" /> Publish
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[190px_minmax(0,1fr)_260px]">
        <aside className="hidden border-r border-slate-200 bg-slate-50 p-3 lg:block">
          <p className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Build</p>
          {[
            { label: 'Pages', icon: LayoutTemplate, target: 1 },
            { label: 'Brand', icon: Palette, target: 3 },
            { label: 'SEO', icon: Search, target: 4 },
            { label: 'Mobile', icon: Smartphone, target: 5 },
          ].map(({ label, icon: Icon, target }) => (
            <button
              key={label}
              type="button"
              onClick={() => setScene(target)}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-black transition ${scene === target ? 'bg-white text-brand-red-700 shadow-sm' : 'text-slate-700 hover:bg-white'}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </aside>

        <div className="min-w-0 bg-slate-100 p-3 sm:p-4">
          <SitePreview scene={scene} />
        </div>

        <aside className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">PARIS</p>
              <p className="text-[11px] font-semibold text-slate-500">Build by voice or text</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-100 p-3 text-xs font-semibold leading-5 text-slate-700">
            {prompt}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-300 bg-white p-2">
            <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800" aria-label="Use voice command">
              <Mic className="h-4 w-4" />
            </button>
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-500">Tell PARIS what to change…</span>
            <button type="button" onClick={() => setScene(Math.min(scene + 1, SCENES.length - 1))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-red-700 text-white" aria-label="Send demo command">
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {QUICK_COMMANDS.map((command, index) => (
              <button
                key={command}
                type="button"
                onClick={() => setScene(Math.min(index + 2, 5))}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-[11px] font-bold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
              >
                <span>{command}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              </button>
            ))}
          </div>

          {scene >= 1 ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-800">
              <Check className="h-3.5 w-3.5" /> Changes saved to this draft
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export default function WebsiteBuilderCommercial() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voiceError, setVoiceError] = useState(false);

  useEffect(() => {
    if (playing) return;
    const timer = window.setInterval(() => setScene((current) => (current + 1) % SCENES.length), 5200);
    return () => window.clearInterval(timer);
  }, [playing]);

  const narrated = useMemo(() => !voiceError, [voiceError]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch {
      setVoiceError(true);
      setPlaying(false);
    }
  }

  return (
    <section className="border-y border-cyan-100 bg-gradient-to-b from-cyan-50 via-white to-rose-50 px-4 py-14 text-slate-950 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-red-700">Interactive Website Builder Demo</p>
            <h2 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">See the builder. Click the controls. Hear the commercial.</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
              This is a visual product walkthrough, not a slide deck. Move through the builder workspace, change the preview, use PARIS commands, switch to mobile, and walk the site all the way to publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={togglePlayback} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 font-black text-white shadow-sm hover:bg-brand-red-800">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {playing ? 'Pause narration' : 'Play with natural voice'}
            </button>
            <Link href="/apps/website-builder/start-trial" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-5 font-black text-slate-950 hover:bg-slate-50">
              Try the real builder
            </Link>
          </div>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Website Builder demo steps">
          {SCENES.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={scene === index}
              onClick={() => {
                setScene(index);
                setPlaying(false);
                audioRef.current?.pause();
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${scene === index ? 'border-brand-red-700 bg-brand-red-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50'}`}
            >
              {index + 1}. {item.label}
            </button>
          ))}
        </div>

        <BuilderWorkspace scene={scene} setScene={setScene} />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-bold text-slate-600">
            {narrated ? 'Natural voice narration available' : 'Visual demo mode'} · Step {scene + 1} of {SCENES.length}
          </div>
          <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-cyan-500 transition-[width] duration-300" style={{ width: `${playing ? Math.max(0, Math.min(100, progress)) : ((scene + 1) / SCENES.length) * 100}%` }} />
          </div>
        </div>

        {voiceError ? (
          <p className="mt-3 text-sm font-semibold text-amber-800">The click-through visual demo remains available. Narration will resume when the configured voice service is available.</p>
        ) : null}

        <audio
          ref={audioRef}
          preload="none"
          src="/api/store/website-builder/commercial-voice"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(100);
            setScene(SCENES.length - 1);
          }}
          onError={() => {
            setVoiceError(true);
            setPlaying(false);
          }}
          onTimeUpdate={(event) => {
            const audio = event.currentTarget;
            setScene(sceneFromTime(audio.currentTime));
            if (Number.isFinite(audio.duration) && audio.duration > 0) setProgress((audio.currentTime / audio.duration) * 100);
          }}
        />
      </div>
    </section>
  );
}
