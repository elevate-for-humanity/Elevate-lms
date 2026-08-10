'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Volume2, VolumeX, X } from 'lucide-react';
import { storeGuideFlow, type GuideChoice, GUIDE_STORAGE_KEYS } from '@/lib/guide/flows';

interface StoreGuideChatProps {
  onStartTour?: (tourId: string) => void;
  forceOpen?: boolean;
}

const choiceImages: Record<string, string> = {
  shop: '/images/pages/shop-hero.webp',
  courses: '/images/pages/shop-hero.webp',
  workbooks: '/images/pages/training-classroom.webp',
  licensing: '/images/pages/shop-hero.webp',
  'not-sure': '/images/pages/store-recommendations.webp',
};

function useSpeech() {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) synthRef.current = window.speechSynthesis;
    return () => synthRef.current?.cancel();
  }, []);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth || isMuted || !text.trim()) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synth.speak(utterance);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((value) => {
      if (!value) stop();
      return !value;
    });
  }, [stop]);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}

export default function StoreGuideChat({ onStartTour, forceOpen = false }: StoreGuideChatProps) {
  const router = useRouter();
  const { speak, stop, isSpeaking, isMuted, toggleMute } = useSpeech();
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [currentQuestionId, setCurrentQuestionId] = useState('main');
  const [selectedChoice, setSelectedChoice] = useState<GuideChoice | null>(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return undefined;
    }
    if (hasAutoOpened || localStorage.getItem(GUIDE_STORAGE_KEYS.COMPLETED)) return undefined;
    const timer = window.setTimeout(() => {
      setIsOpen(true);
      setHasAutoOpened(true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [forceOpen, hasAutoOpened]);

  const close = useCallback(() => {
    stop();
    setIsOpen(false);
    setHasAutoOpened(true);
  }, [stop]);

  const open = useCallback(() => {
    setCurrentQuestionId('main');
    setSelectedChoice(null);
    setIsOpen(true);
    const question = storeGuideFlow.questions.find((item) => item.id === 'main');
    if (question) window.setTimeout(() => speak(`${storeGuideFlow.welcomeMessage}. ${question.question}`), 200);
  }, [speak]);

  const selectChoice = useCallback((choice: GuideChoice) => {
    stop();
    if (choice.id === 'not-sure') {
      const current = storeGuideFlow.questions.find((item) => item.id === currentQuestionId);
      if (current?.followUp) {
        setCurrentQuestionId(current.followUp);
        const followUp = storeGuideFlow.questions.find((item) => item.id === current.followUp);
        if (followUp) speak(followUp.question);
      }
      return;
    }
    setSelectedChoice(choice);
    speak(`Taking you to ${choice.label}. ${choice.description || ''}`);
  }, [currentQuestionId, speak, stop]);

  const confirm = useCallback((startTour: boolean) => {
    if (!selectedChoice) return;
    stop();
    localStorage.setItem(GUIDE_STORAGE_KEYS.COMPLETED, 'true');
    setIsOpen(false);
    const route = selectedChoice.route;
    const tourId = selectedChoice.tourId;
    if (route) router.push(route);
    if (startTour && selectedChoice.startTour && tourId && onStartTour) {
      window.setTimeout(() => onStartTour(tourId), 500);
    }
  }, [onStartTour, router, selectedChoice, stop]);

  if (!isOpen) {
    return (
      <button type="button" onClick={open} className="fixed bottom-6 right-6 z-50 flex min-h-11 items-center gap-2 rounded-full bg-orange-600 px-4 py-3 font-bold text-white shadow-lg hover:bg-orange-700" aria-label="Open store guide">
        <Image src="/images/pages/store-guide-1.webp" alt="Store guide" width={28} height={28} className="rounded-full" />
        Need help?
      </button>
    );
  }

  const currentQuestion = storeGuideFlow.questions.find((item) => item.id === currentQuestionId);

  return (
    <>
      <button type="button" className="fixed inset-0 z-50 cursor-default bg-black/50" onClick={close} aria-label="Close store guide" />
      <div className="fixed left-1/2 top-1/2 z-[51] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Store guide">
        <div className="flex items-center gap-3 border-b border-slate-200 p-4">
          <Image src="/images/pages/store-guide-1.webp" alt="Store guide" width={54} height={54} className={`rounded-full border-2 ${isSpeaking ? 'border-orange-500' : 'border-slate-200'}`} />
          <div className="min-w-0 flex-1"><p className="font-black text-slate-950">Store Guide</p><p className="truncate text-sm text-slate-600">{isSpeaking ? 'Speaking…' : storeGuideFlow.welcomeMessage}</p></div>
          <button type="button" onClick={toggleMute} className="rounded-lg p-2 hover:bg-slate-100" aria-label={isMuted ? 'Turn guide speech on' : 'Mute guide'}>{isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 text-orange-700" />}</button>
          <button type="button" onClick={close} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close guide"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto p-5">
          {!selectedChoice ? (
            <>
              <h2 className="text-xl font-black text-slate-950">{currentQuestion?.question}</h2>
              <div className="mt-4 space-y-3">
                {currentQuestion?.choices.map((choice) => (
                  <button key={choice.id} type="button" onClick={() => selectChoice(choice)} className="flex w-full items-center gap-3 rounded-xl border-2 border-slate-200 p-3 text-left hover:border-orange-500 hover:bg-orange-50">
                    <Image src={choiceImages[choice.id] || '/images/pages/store-recommendations.webp'} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />
                    <div><p className="font-black text-slate-950">{choice.label}</p>{choice.description ? <p className="mt-1 text-sm text-slate-700">{choice.description}</p> : null}</div>
                  </button>
                ))}
              </div>
              {currentQuestionId !== 'main' ? <button type="button" onClick={() => setCurrentQuestionId('main')} className="mt-4 text-sm font-bold text-slate-700 hover:underline">← Back</button> : null}
            </>
          ) : (
            <div className="text-center">
              <Image src={choiceImages[selectedChoice.id] || '/images/pages/store-recommendations.webp'} alt="" width={88} height={88} className="mx-auto h-22 w-22 rounded-xl object-cover" />
              <h2 className="mt-4 text-xl font-black text-slate-950">Go to {selectedChoice.label}?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{selectedChoice.description}</p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setSelectedChoice(null); stop(); }} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-900 hover:bg-slate-50">Choose again</button>
                <button type="button" onClick={() => confirm(Boolean(selectedChoice.startTour))} className="flex-1 rounded-xl bg-orange-600 px-4 py-3 font-black text-white hover:bg-orange-700">Continue</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
