'use client';

import Image from 'next/image';
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
    if (forceOpen) {
      setOpen(true);
      return;
    }
    if (typeof window === 'undefined' || localStorage.getItem(GUIDE_STORAGE_KEYS.COMPLETED)) return;
    const timer = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(timer);
  }, [forceOpen]);

  const currentQuestion = storeGuideFlow.questions.find((question) => question.id === questionId);

  const stop = () => naturalVoice.stop();
  const speak = (text: string) => {
    if (muted || !text.trim()) return;
    void naturalVoice.play(text, { voice: 'coral', style: 'assistant', rate: 1 });
  };
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
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-brand-orange-600 px-4 py-3 font-semibold text-white shadow-lg">
        <Image src="/images/pages/store-guide-1.webp" alt="Store guide" width={24} height={24} className="rounded-full" sizes="(max-width: 768px) 100vw, 50vw" /> Need help?
      </button>
    );
  }

  return (
    <>
      <button type="button" aria-label="Close store guide" className="fixed inset-0 z-50 bg-black/50" onClick={() => { stop(); setOpen(false); }} />
      <section className="fixed left-1/2 top-1/2 z-[51] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-slate-300 p-4">
          <Image src="/images/pages/store-guide-1.webp" alt="Store guide" width={52} height={52} className="rounded-full" sizes="(max-width: 768px) 100vw, 50vw" />
          <div className="flex-1"><h2 className="font-bold text-slate-950">Store Guide</h2><p className="text-sm font-medium text-slate-700">{speaking ? 'Speaking naturally…' : storeGuideFlow.welcomeMessage}</p></div>
          <button type="button" onClick={toggle} aria-label={muted ? 'Unmute natural voice' : 'Mute natural voice'}>{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
          <button type="button" onClick={() => { stop(); setOpen(false); }} aria-label="Close"><X className="h-5 w-5" /></button>
        </header>
        <div className="max-h-[65vh] overflow-y-auto p-4">
          {!confirmed ? (
            <>
              <h3 className="text-lg font-bold text-slate-950">{currentQuestion?.question}</h3>
              <div className="mt-4 space-y-2">
                {currentQuestion?.choices.map((item) => (
                  <button key={item.id} type="button" onClick={() => select(item)} className="w-full rounded-xl border border-slate-300 p-3 text-left hover:border-brand-orange-400 hover:bg-brand-orange-50">
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
                <button type="button" onClick={() => go(Boolean(choice?.startTour))} className="flex-1 rounded-lg bg-brand-orange-600 px-4 py-3 font-semibold text-white">Continue</button>
              </div>
              <button type="button" onClick={() => { setConfirmed(false); setChoice(null); }} className="mt-4 text-sm font-semibold text-brand-blue-800">Choose something else</button>
            </div>
          )}
          {naturalVoice.error ? <p className="mt-4 text-sm font-semibold text-red-800">Natural voice is temporarily unavailable; the guide remains fully usable by text.</p> : null}
        </div>
      </section>
    </>
  );
}
