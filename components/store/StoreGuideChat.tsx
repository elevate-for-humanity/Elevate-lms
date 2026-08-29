'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { GUIDE_STORAGE_KEYS, GuideChoice, storeGuideFlow } from '@/lib/guide/flows';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

type Props = { onStartTour?: (tourId: string) => void; forceOpen?: boolean };

export default function StoreGuideChat({ onStartTour, forceOpen = false }: Props) {
  const router = useRouter();
  const naturalVoice = useNaturalVoice();
  const [open, setOpen] = useState(false);
  const [questionId, setQuestionId] = useState('main');
  const [choice, setChoice] = useState<GuideChoice | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [muted, setMuted] = useState(false);
  const speaking = naturalVoice.isPlaying || naturalVoice.isLoading;

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const currentQuestion = storeGuideFlow.questions.find((question) => question.id === questionId);

  const stop = () => naturalVoice.stop();
  const speak = (text: string) => {
    if (muted || !text.trim()) return;
    void naturalVoice.play(text, { voice: 'coral', style: 'assistant', rate: 1 });
  };
  function openGuide() {
    setOpen(true);
    speak("Hi, I'm PARIS, your Elevate Store guide. What are you trying to do? I can show you the best product, a live demo, and the right starting plan.");
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
      <button type="button" onClick={openGuide} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-3 font-bold text-white shadow-xl shadow-orange-900/20 transition hover:-translate-y-0.5 hover:shadow-2xl">
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-rose-700 shadow-inner" aria-hidden="true">P<span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white bg-emerald-500" /></span><span><span className="block text-left text-[10px] font-black uppercase tracking-widest text-white/80">Store guide · tap to hear</span>Ask PARIS</span>
      </button>
    );
  }

  return (
    <section
      aria-label="PARIS Store Advisor"
      className="fixed bottom-4 right-4 z-[51] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-2xl shadow-orange-950/20 sm:bottom-6 sm:right-6"
    >
        <header className="flex items-center gap-3 bg-gradient-to-r from-cyan-50 via-white to-orange-50 p-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-orange-400 text-xl font-black text-white ring-4 ring-white shadow-lg" aria-label="PARIS avatar">P<span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-white bg-emerald-500" /></div>
          <div className="flex-1"><p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">PARIS · Store Guide</p><h2 className="text-lg font-black text-slate-950">PARIS</h2><p className="text-sm font-semibold text-slate-700">{speaking ? 'Explaining your best option…' : 'Tell me what you need. I’ll recommend the right product, demo, and plan.'}</p></div>
          <button type="button" onClick={toggle} aria-label={muted ? 'Unmute natural voice' : 'Mute natural voice'}>{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
          <button type="button" onClick={() => { stop(); setOpen(false); }} aria-label="Close"><X className="h-5 w-5" /></button>
        </header>
        <div className="max-h-[52vh] overflow-y-auto p-4 sm:p-5">
          {!confirmed ? (
            <>
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
      </section>
  );
}
