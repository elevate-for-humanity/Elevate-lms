'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Volume2, VolumeX } from 'lucide-react';
import { storeGuideFlow, GuideChoice, GUIDE_STORAGE_KEYS, GUIDE_ANALYTICS } from '@/lib/guide/flows';

interface StoreGuideChatProps {
  onStartTour?: (tourId: string) => void;
  forceOpen?: boolean;
}

// Image mapping for choices
const choiceImages: Record<string, string> = {
  'shop': '/images/shop/shop-hero.jpg',
  'courses': '/images/store/banners/courses-banner.jpg',
  'workbooks': '/images/heroes/lms-courses.jpg',
  'licensing': '/images/store/banners/apps-banner.jpg',
  'not-sure': '/images/team-hq/instructor-1.jpg',
};

// Simple speech hook
function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current || isMuted) return;
    
    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    } catch {
      // Speech failed silently
    }
  }, [isMuted]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      try { synthRef.current.cancel(); } catch { /* ignore cancel errors */ }
      setIsSpeaking(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) stop();
      return !prev;
    });
  }, [stop]);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}

export default function StoreGuideChat({ onStartTour, forceOpen = false }: StoreGuideChatProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState('main');
  const [selectedChoice, setSelectedChoice] = useState<GuideChoice | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  
  const { speak, stop, isSpeaking, isMuted, toggleMute } = useSpeech();

  // Auto-open and greet on first visit (or every visit if not dismissed)
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (typeof window === 'undefined') return;
    if (hasAutoOpened) return;

    const completed = localStorage.getItem(GUIDE_STORAGE_KEYS.COMPLETED);
    if (completed) return;

    // Always greet on store pages — clear dismissed flag so returning visitors see it too
    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasAutoOpened(true);
      const mainQuestion = storeGuideFlow.questions.find(q => q.id === 'main');
      if (mainQuestion) {
        setTimeout(() => speak(storeGuideFlow.welcomeMessage + '. ' + mainQuestion.question), 400);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [forceOpen, hasAutoOpened, speak]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setCurrentQuestionId('main');
    setSelectedChoice(null);
    setShowConfirmation(false);
    // console.log(GUIDE_ANALYTICS.GUIDE_OPENED, { auto: false });
    
    const mainQuestion = storeGuideFlow.questions.find(q => q.id === 'main');
    if (mainQuestion) {
      setTimeout(() => speak(storeGuideFlow.welcomeMessage + '. ' + mainQuestion.question), 300);
    }
  }, [speak]);

  const handleClose = useCallback(() => {
    stop();
    setIsOpen(false);
    // Only suppress for this session — don't permanently dismiss
    setHasAutoOpened(true);
  }, [stop]);

  const handleChoiceSelect = useCallback((choice: GuideChoice) => {
    // console.log(GUIDE_ANALYTICS.ROUTE_SELECTED, { choice: choice.id, route: choice.route });
    stop();

    if (choice.id === 'not-sure') {
      const currentQuestion = storeGuideFlow.questions.find(q => q.id === currentQuestionId);
      if (currentQuestion?.followUp) {
        setCurrentQuestionId(currentQuestion.followUp);
        const followUp = storeGuideFlow.questions.find(q => q.id === currentQuestion.followUp);
        if (followUp) {
          setTimeout(() => speak(followUp.question), 200);
        }
      }
      return;
    }

    setSelectedChoice(choice);
    setShowConfirmation(true);
    
    const confirmText = `Taking you to ${choice.label}. ${choice.description || ''}`;
    setTimeout(() => speak(confirmText), 200);
  }, [currentQuestionId, speak, stop]);

  const handleConfirm = useCallback((startTour: boolean) => {
    if (!selectedChoice) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem(GUIDE_STORAGE_KEYS.COMPLETED, 'true');
    }
    // console.log(GUIDE_ANALYTICS.GUIDE_COMPLETED, { route: selectedChoice.route });

    setIsOpen(false);

    if (selectedChoice.route) {
      router.push(selectedChoice.route);
    }

    if (startTour && selectedChoice.startTour && selectedChoice.tourId && onStartTour) {
      setTimeout(() => {
        onStartTour(selectedChoice.tourId!);
      }, 500);
    }
  }, [selectedChoice, router, onStartTour]);

  const currentQuestion = storeGuideFlow.questions.find(q => q.id === currentQuestionId);

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
        aria-label="Open store guide"
      >
        <Image
          src="/images/team-hq/instructor-1.jpg"
          alt="Guide"
          width={24}
          height={24}
          className="rounded-full"
        />
        <span className="font-medium">Need help?</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop - tap to close */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      {/* Chat Modal - Centered, not full screen on mobile */}
      <div 
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Avatar */}
          <div className="bg-white border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              {/* Avatar Image */}
              <div className={`w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0 ${isSpeaking ? 'border-red-500 animate-pulse' : 'border-slate-200'}`}>
                <Image
                  src="/images/team-hq/instructor-1.jpg"
                  alt="Store Guide"
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">Store Guide</h2>
                <p className="text-slate-500 text-sm">
                  {isSpeaking ? 'Speaking...' : storeGuideFlow.welcomeMessage}
                </p>
              </div>

              {/* Mute & Close buttons */}
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-slate-100 rounded-full"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-red-500" />}
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {!showConfirmation ? (
              <>
                <h3 className="text-lg font-bold text-black mb-4">
                  {currentQuestion?.question}
                </h3>
                
                {/* Choices with Images */}
                <div className="space-y-3">
                  {currentQuestion?.choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleChoiceSelect(choice)}
                      className="w-full flex items-center gap-3 p-3 bg-white hover:bg-orange-50 border-2 border-gray-200 hover:border-orange-500 rounded-xl transition-all text-left"
                    >
                      {/* Choice Image */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={choiceImages[choice.id] || '/images/team-hq/instructor-1.jpg'}
                          alt={choice.label}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-black">{choice.label}</p>
                        {choice.description && (
                          <p className="text-sm text-gray-600 truncate">{choice.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {currentQuestionId !== 'main' && (
                  <button
                    onClick={() => setCurrentQuestionId('main')}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back
                  </button>
                )}
              </>
            ) : (
              /* Confirmation */
              <div className="text-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden mx-auto mb-4">
                  <Image
                    src={choiceImages[selectedChoice?.id || ''] || '/images/team-hq/instructor-1.jpg'}
                    alt={selectedChoice?.label || ''}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Taking you to {selectedChoice?.label}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedChoice?.description}
                </p>

                {selectedChoice?.startTour && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-orange-800 font-medium">
                      Would you like a quick tour?
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  {selectedChoice?.startTour ? (
                    <>
                      <button
                        onClick={() => handleConfirm(false)}
                        className="flex-1 py-3 px-4 bg-gray-100 text-black rounded-lg font-medium hover:bg-gray-200"
                      >
                        No thanks
                      </button>
                      <button
                        onClick={() => handleConfirm(true)}
                        className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                      >
                        Yes, show me
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConfirm(false)}
                      className="w-full py-3 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                    >
                      Let's go!
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setSelectedChoice(null);
                  }}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Choose something else
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
