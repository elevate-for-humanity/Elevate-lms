'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageCircle, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { GUIDE_STORAGE_KEYS, GuideChoice, storeGuideFlow } from '@/lib/guide/flows';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import ParisChat from '@/components/paris/ParisChat';

type Props = { onStartTour?: (tourId: string) => void; forceOpen?: boolean };

const STORE_INTERVIEW_GREETING =
  "Hi, I'm PARIS. I'll start with a quick interview, then recommend the best Elevate product, live demo, and starting plan for you.";

export default function StoreGuideChat({ onStartTour, forceOpen = false }: Props) {
  const router = useRouter();
  const naturalVoice = useNaturalVoice();
  const [open, setOpen] = useState(forceOpen);
  const [questionId, setQuestionId] = useState('main');
  const [choice, setChoice] = useState<GuideChoice | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState<'recommend' | 'chat'>('chat');
  const speaking = naturalVoice.isPlaying || naturalVoice.isLoading;

  const currentQuestion = storeGuideFlow.questions.find((question) => question.id === questionId);

  const stop = () => naturalVoice.stop();
  const speak = (text: string) => {
    if (muted || !text.trim()) return;
    void naturalVoice.play(text, { voice: 'coral', style: 'assistant', rate: 1 });
  };
  function openGuide() {
    setMode('chat');
    setOpen(true);
    speak(STORE_INTERVIEW_GREETING);
  }

  const toggle = () => {
    setMuted((value) => {
      if (!value) stop();
      return !value;
    });
  };

  function select(next: GuideChoice) {
    stop();
    if (next.id === 'not-sure' && currentQuestion?.followUp) {
      setQuestionId(currentQuestion.followUp);
      const followUp = storeGuideFlow.questions.find((question) => question.id === currentQuestion.followUp);
      if (followUp) speak(followUp.question);
      return;
    }
    setChoice(next);
    setConfirmed(true);
    speak(`Taking you to ${next.label}. ${next.description || ''}`);
  }

  function go(withTour: boolean) {
    if (!choice) return;
    localStorage.setItem(GUIDE_STORAGE_KEYS.COMPLETED, 'true');
    stop();
    setOpen(false);
    if (choice.route) router.push(choice.route);
    if (withTour && choice.startTour && choice.tourId && onStartTour) {
      window.setTimeout(() => onStartTour(choice.tourId!), 500);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={openGuide} aria-label="Open PARIS Store Guide" className="fixed bottom-4 right-4 z-50 flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 p-2.5 font-bold text-white shadow-xl shadow-orange-900/20 transition hover:-translate-y-0.5 hover:shadow-2xl sm:bottom-6 sm:right-6 sm:px-5 sm:py-3">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-rose-700 shadow-inner" aria-hidden="true">P<span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white bg-emerald-500" /></span><span className="hidden sm:block"><span className="block text-left text-[10px] font-black uppercase tracking-widest text-white/80">Quick interview · tap to hear</span>Let PARIS interview you</span>
      </button>
    );
  }

  return (
    <section
      aria-label="PARIS Store Advisor"
      className="fixed inset-x-2 bottom-2 z-[51] max-h-[calc(100dvh-1rem)] overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-2xl shadow-orange-950/20 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[calc(100%-2rem)] sm:max-w-sm sm:rounded-3xl"
    >
        <header className="flex items-center gap-2 bg-gradient-to-r from-cyan-50 via-white to-orange-50 p-3 sm:gap-3 sm:p-4">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-orange-400 text-lg font-black text-white ring-2 ring-white shadow-lg sm:h-14 sm:w-14 sm:text-xl sm:ring-4" aria-label="PARIS avatar">P<span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-emerald-500" /></div>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-rose-700 sm:text-xs sm:tracking-[0.16em]">PARIS · Store Guide</p><h2 className="text-base font-black text-slate-950 sm:text-lg">PARIS</h2><p className="line-clamp-2 text-xs font-semibold text-slate-700 sm:text-sm">{speaking ? 'Explaining your best option…' : 'Tell me what you need. I’ll recommend the right product, demo, and plan.'}</p></div>
          <button type="button" onClick={toggle} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-white" aria-label={muted ? 'Unmute natural voice' : 'Mute natural voice'}>{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
          <button type="button" onClick={() => { stop(); setOpen(false); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm" aria-label="Close PARIS"><X className="h-5 w-5" /></button>
        </header>
        <div className="grid grid-cols-2 border-y border-slate-200 bg-white p-2">
          <button
            type="button"
            onClick={() => setMode('chat')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${mode === 'chat' ? 'bg-orange-100 text-orange-900' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <MessageCircle className="h-4 w-4" /> Guided interview
          </button>
          <button
            type="button"
            onClick={() => setMode('recommend')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${mode === 'recommend' ? 'bg-cyan-100 text-cyan-900' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Sparkles className="h-4 w-4" /> Quick choices
          </button>
        </div>
        {mode === 'chat' ? (
          <ParisChat surface="store" showHeader={false} voiceEnabled={!muted} className="h-[44dvh] min-h-[280px] max-h-[430px] sm:h-[52vh] sm:min-h-[360px]" />
        ) : (
        <div className="max-h-[52vh] overflow-y-auto p-4 sm:p-5">
          {!confirmed ? (
            <>
              <p className="mb-3 rounded-xl bg-cyan-50 px-3 py-2 text-sm font-semibold leading-6 text-slate-800">
                {STORE_INTERVIEW_GREETING}
              </p>
              <h3 className="text-lg font-bold text-slate-950">{currentQuestion?.question}</h3>
              <div className="mt-4 space-y-2">
                {currentQuestion?.choices.map((item) => (
                  <button key={item.id} type="button" onClick={() => select(item)} className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md">
                    <p className="font-semibold text-slate-950">{item.label}</p>{item.description ? <p className="mt-1 text-sm font-medium text-slate-700">{item.description}</p> : null}
                  </button>
                ))}
              </div>
              {questionId !== 'main' ? <button type="button" onClick={() => setQuestionId('main')} className="mt-4 text-sm font-semibold text-brand-blue-800">← Back</button> : null}
            </>
          ) : (
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-950">{choice?.label}</h3>
              <p className="mt-2 font-medium text-slate-700">{choice?.description}</p>
              <div className="mt-6 flex gap-3">
                {choice?.startTour ? <button type="button" onClick={() => go(false)} className="flex-1 rounded-lg bg-slate-100 px-4 py-3 font-semibold text-slate-950">No tour</button> : null}
                <button type="button" onClick={() => go(Boolean(choice?.startTour))} className="flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-3 font-bold text-white shadow-lg hover:from-rose-700 hover:to-orange-600">Continue</button>
              </div>
              <button type="button" onClick={() => { setConfirmed(false); setChoice(null); }} className="mt-4 text-sm font-semibold text-brand-blue-800">Choose something else</button>
            </div>
          )}
          {naturalVoice.error ? <p className="mt-4 text-sm font-semibold text-red-800">Natural voice is temporarily unavailable; the guide remains fully usable by text.</p> : null}
        </div>
        )}
      </section>
  );
}
