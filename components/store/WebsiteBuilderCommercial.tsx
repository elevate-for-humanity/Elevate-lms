'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  BriefcaseBusiness,
  Check,
  FileText,
  Globe2,
  GraduationCap,
  ImageIcon,
  Megaphone,
  Mic,
  Pause,
  Play,
  Rocket,
  Sparkles,
  Video,
} from 'lucide-react';

const SCENES = [
  { start: 0, label: 'The problem' },
  { start: 8, label: 'Meet PARIS' },
  { start: 17, label: 'Talk or type' },
  { start: 27, label: 'It keeps building' },
  { start: 38, label: 'Add business power' },
  { start: 50, label: 'Try the whole system' },
  { start: 61, label: 'Publish and grow' },
  { start: 72, label: 'Start building' },
] as const;

const UPGRADES = [
  { icon: Megaphone, label: 'Marketing' },
  { icon: FileText, label: 'Grant Writer' },
  { icon: ImageIcon, label: 'Image Builder' },
  { icon: Video, label: 'Commercial Video' },
  { icon: GraduationCap, label: 'Course Builder' },
  { icon: BriefcaseBusiness, label: 'AI Assistants' },
];

function sceneFromTime(seconds: number) {
  let index = 0;
  for (let i = 0; i < SCENES.length; i += 1) {
    if (seconds >= SCENES[i].start) index = i;
  }
  return index;
}

export default function WebsiteBuilderCommercial() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voiceError, setVoiceError] = useState(false);

  useEffect(() => {
    if (playing) return;
    const timer = window.setInterval(() => {
      setScene((current) => (current + 1) % SCENES.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [playing]);

  const sceneLabel = SCENES[scene]?.label ?? SCENES[0].label;
  const percent = Math.max(0, Math.min(100, progress));
  const narrated = useMemo(() => !voiceError, [voiceError]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      setVoiceError(true);
      setPlaying(false);
    }
  }

  function renderScene() {
    if (scene === 0) {
      return (
        <div className="grid h-full place-items-center px-5 text-center sm:px-10">
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Globe2 className="h-8 w-8" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Running a business is already a full-time job</p>
            <h3 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
              Your website should not become another one.
            </h3>
            <div className="mx-auto mt-6 flex max-w-lg items-center justify-center gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/15 px-3 py-2">No blank canvas</span>
              <span className="rounded-full border border-white/15 px-3 py-2">No code</span>
              <span className="rounded-full border border-white/15 px-3 py-2">No guessing</span>
            </div>
          </div>
        </div>
      );
    }

    if (scene === 1) {
      return (
        <div className="grid h-full gap-5 p-5 sm:grid-cols-[0.8fr_1.2fr] sm:p-8">
          <div className="flex flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red-600 shadow-xl shadow-brand-red-950/30">
              <Bot className="h-7 w-7" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Meet PARIS</p>
            <h3 className="mt-2 text-3xl font-black">Tell her what you want.</h3>
            <p className="mt-3 leading-7 text-slate-300">PARIS turns the conversation into a working website draft instead of sending you back to a pile of settings.</p>
          </div>
          <div className="flex flex-col justify-center rounded-3xl bg-white p-5 text-slate-950 shadow-2xl">
            <div className="rounded-2xl bg-slate-100 p-4 text-sm font-semibold">“Build a professional website for my healthcare business. I need services, booking, and a strong call to action.”</div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
              <Sparkles className="h-5 w-5 text-brand-red-700" />
              <div>
                <p className="font-black">PARIS is building…</p>
                <div className="mt-2 flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (scene === 2) {
      return (
        <div className="grid h-full place-items-center p-5 sm:p-8">
          <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Talk or type</p>
                <h3 className="mt-2 text-3xl font-black">Build by conversation.</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30">
                <Mic className="h-6 w-6 animate-pulse" />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['Make it more professional.', 'Change the colors.', 'Add online booking.', 'Rewrite my services.'].map((text, index) => (
                <div key={text} className="translate-y-0 rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-semibold transition hover:-translate-y-1 hover:border-cyan-400/50" style={{ transitionDelay: `${index * 80}ms` }}>
                  “{text}”
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (scene === 3) {
      return (
        <div className="grid h-full gap-4 p-5 sm:grid-cols-2 sm:p-8">
          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-2xl">
            <div className="flex gap-2 border-b border-slate-200 pb-3">
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="h-3 w-3 rounded-full bg-slate-300" />
            </div>
            <div className="mt-5 h-20 rounded-2xl bg-slate-950 p-4 text-white">
              <div className="h-3 w-36 animate-pulse rounded bg-white/80" />
              <div className="mt-3 h-2 w-56 animate-pulse rounded bg-white/40" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-xl bg-slate-100" />)}
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">It keeps building</p>
            <h3 className="mt-2 text-3xl font-black">PARIS stays with the user.</h3>
            <p className="mt-3 leading-7 text-slate-300">The first draft is only the beginning. The customer keeps talking, PARIS keeps changing the saved site, and the preview keeps moving with them.</p>
            <div className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-300"><Check className="h-4 w-4" /> Changes saved to the draft</div>
          </div>
        </div>
      );
    }

    if (scene === 4) {
      return (
        <div className="h-full p-5 sm:p-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">The website is only the beginning</p>
            <h3 className="mt-2 text-3xl font-black sm:text-4xl">Upgrade the business from the same journey.</h3>
          </div>
          <div className="mx-auto mt-6 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3">
            {UPGRADES.map(({ icon: Icon, label }, index) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:scale-[1.03] hover:bg-white/10" style={{ transitionDelay: `${index * 60}ms` }}>
                <Icon className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 font-black">{label}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (scene === 5) {
      return (
        <div className="grid h-full place-items-center p-5 sm:p-8">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">14-day trial</p>
                <h3 className="mt-2 text-4xl font-black">Try the whole experience.</h3>
                <p className="mt-3 max-w-2xl leading-7 text-slate-200">One website, up to five pages, publishing on an Elevate web address, limited previews of the upgrade tools, and a shared pool of 500 AI credits.</p>
              </div>
              <div className="min-w-44 rounded-3xl bg-white p-5 text-center text-slate-950 shadow-2xl">
                <p className="text-5xl font-black">500</p>
                <p className="mt-1 text-sm font-black uppercase tracking-widest text-slate-500">trial credits</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-100">
              {['PARIS', 'Marketing', 'Grant Writer', 'Images', 'Video', 'Courses', 'AI Team'].map((item) => <span key={item} className="rounded-full border border-white/15 bg-slate-950/40 px-3 py-2">{item}</span>)}
            </div>
          </div>
        </div>
      );
    }

    if (scene === 6) {
      return (
        <div className="grid h-full gap-5 p-5 sm:grid-cols-[1.1fr_0.9fr] sm:p-8">
          <div className="flex flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Publish when ready</p>
            <h3 className="mt-2 text-4xl font-black">Start small. Add power as the business grows.</h3>
            <p className="mt-3 leading-7 text-slate-300">Use an Elevate web address during the trial. Upgrade for custom domains, more sites, more credits, additional assistants, advanced automation, and premium business tools.</p>
          </div>
          <div className="flex items-center justify-center rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
            <div className="w-full rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 font-black"><Globe2 className="h-5 w-5 text-brand-red-700" /> mybusiness.app.elevateforhumanity.org</div>
              <div className="mt-5 h-3 w-full rounded-full bg-slate-100"><div className="h-3 w-4/5 rounded-full bg-emerald-500" /></div>
              <p className="mt-3 text-sm font-semibold text-slate-600">Preview complete. Ready to publish.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid h-full place-items-center px-5 text-center sm:px-10">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-red-600 shadow-2xl shadow-brand-red-950/30">
            <Rocket className="h-8 w-8" />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Start with a conversation</p>
          <h3 className="mx-auto mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Build with PARIS. Build with Elevate.</h3>
          <Link href="/apps/website-builder/start-trial" className="mt-7 inline-flex items-center rounded-2xl bg-white px-7 py-4 font-black text-slate-950 transition hover:scale-105">
            Start the 14-day trial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="border-y border-slate-800 bg-slate-950 px-4 py-14 text-white sm:py-18">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Website Builder Commercial</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Watch the builder sell itself.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">A live animated demo with a natural AI voiceover. The visuals continue even when sound is off.</p>
          </div>
          <button type="button" onClick={togglePlayback} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 font-black text-white hover:bg-brand-red-700">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {playing ? 'Pause commercial' : 'Play commercial with voice'}
          </button>
        </div>

        <div className="relative min-h-[470px] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] shadow-2xl sm:min-h-[520px]">
          <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-brand-red-600/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <div key={scene} className="relative z-10 h-full min-h-[470px] animate-[commercialFade_.45s_ease-out] sm:min-h-[520px]">
            {renderScene()}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4 text-xs font-bold text-slate-300">
              <span>{sceneLabel}</span>
              <span>{narrated ? 'Natural voice narration' : 'Visual demo mode'}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-400 transition-[width] duration-300" style={{ width: `${playing ? percent : ((scene + 1) / SCENES.length) * 100}%` }} />
            </div>
          </div>
        </div>

        {voiceError ? (
          <p className="mt-3 text-sm font-semibold text-amber-300">The visual commercial is still available. Natural narration will play when the configured voice service is available.</p>
        ) : null}

        <audio
          ref={audioRef}
          preload="none"
          src="/api/store/website-builder/commercial-voice"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setProgress(100); setScene(SCENES.length - 1); }}
          onError={() => { setVoiceError(true); setPlaying(false); }}
          onTimeUpdate={(event) => {
            const audio = event.currentTarget;
            setScene(sceneFromTime(audio.currentTime));
            if (Number.isFinite(audio.duration) && audio.duration > 0) setProgress((audio.currentTime / audio.duration) * 100);
          }}
        />
      </div>

      <style jsx>{`
        @keyframes commercialFade {
          from { opacity: 0; transform: translateY(10px) scale(.995); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </section>
  );
}
