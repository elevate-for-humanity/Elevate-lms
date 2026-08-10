'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

interface AIInstructorClientProps {
  lessonTitle?: string;
  context?: 'lesson' | 'quiz' | 'certificate' | 'general';
  autoSpeak?: boolean;
}

export function AIInstructorClient({
  lessonTitle,
  context = 'general',
  autoSpeak = true,
}: AIInstructorClientProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const {
    play,
    stop,
    isPlaying,
    isPaused,
    isLoading,
    error: voiceError,
  } = useNaturalVoice();
  const isSpeaking = isPlaying || isPaused || isLoading;

  const speak = useCallback(async (text: string) => {
    const clean = text.trim();
    if (isMuted || !clean) return;
    setIsVisible(true);
    setCurrentMessage(clean);
    await play(clean, { voice: 'shimmer', style: 'instructor', rate: 1 });
  }, [isMuted, play]);

  useEffect(() => {
    const handleSpeakEvent = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string }>;
      const message = custom.detail?.message;
      if (message) void speak(message);
    };

    window.addEventListener('ai-instructor-speak', handleSpeakEvent);

    let welcomeTimer: ReturnType<typeof setTimeout> | null = null;
    if (autoSpeak && lessonTitle) {
      welcomeTimer = setTimeout(() => {
        void speak(`Welcome to ${lessonTitle}. I'm here to guide you through this ${context === 'general' ? 'lesson' : context}.`);
      }, 2000);
    }

    return () => {
      if (welcomeTimer) clearTimeout(welcomeTimer);
      window.removeEventListener('ai-instructor-speak', handleSpeakEvent);
    };
  }, [autoSpeak, context, lessonTitle, speak]);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full border-slate-400 bg-white p-0 shadow-lg"
        onClick={() => setIsVisible(true)}
        aria-label="Open AI Instructor"
      >
        <Volume2 className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 overflow-hidden border-slate-300 bg-white shadow-2xl">
      <div className="relative h-28 w-full">
        <Image src="/images/pages/ai-tutor-page-1.webp" alt="AI Instructor learning support" fill sizes="320px" className="object-cover" />
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-950">AI Instructor</h3>
            <p className="text-xs font-medium text-slate-700">
              {isLoading ? 'Preparing natural voice…' : isSpeaking ? 'Speaking…' : 'Ready to help'}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0"
              onClick={() => {
                setIsMuted((value) => !value);
                stop();
              }}
              aria-label={isMuted ? 'Enable natural voice' : 'Mute natural voice'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0"
              onClick={() => {
                stop();
                setIsVisible(false);
              }}
              aria-label="Close AI Instructor"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {currentMessage && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-medium leading-6 text-slate-900">{currentMessage}</p>
          </div>
        )}

        {isSpeaking && (
          <div className="mt-3 flex justify-center">
            <div className="flex gap-1" aria-label="AI Instructor speaking">
              <div className="h-4 w-1 animate-pulse rounded-full bg-brand-blue-700" />
              <div className="h-4 w-1 animate-pulse rounded-full bg-brand-blue-700 [animation-delay:150ms]" />
              <div className="h-4 w-1 animate-pulse rounded-full bg-brand-blue-700 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {isSpeaking && (
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={stop}>
            Stop Speaking
          </Button>
        )}
        {voiceError ? <p className="mt-3 text-xs font-semibold text-red-800">Natural narration is temporarily unavailable. Written guidance remains available.</p> : null}
      </div>
    </Card>
  );
}
