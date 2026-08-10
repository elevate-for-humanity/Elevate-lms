'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

interface VoiceInputProps {
  onCommand?: (command: string) => void;
  className?: string;
}

type NavigationCommand = { route: string; response: string };

const NAVIGATION_COMMANDS: Record<string, NavigationCommand> = {
  'go to dashboard': { route: '/lms/dashboard', response: 'Navigating to your dashboard.' },
  'open dashboard': { route: '/lms/dashboard', response: 'Opening your dashboard.' },
  'show my courses': { route: '/lms/courses', response: 'Showing your courses.' },
  'go to courses': { route: '/lms/courses', response: 'Going to your courses.' },
  'show programs': { route: '/programs', response: 'Showing available programs.' },
  'go to programs': { route: '/programs', response: 'Going to programs.' },
  'show certificates': { route: '/lms/certificates', response: 'Showing your certificates.' },
  'my certificates': { route: '/lms/certificates', response: 'Opening your certificates.' },
  'show progress': { route: '/lms/progress', response: 'Showing your progress.' },
  'my progress': { route: '/lms/progress', response: 'Opening your progress page.' },
  'go home': { route: '/', response: 'Going to the home page.' },
  'go to home': { route: '/', response: 'Navigating home.' },
  'show messages': { route: '/lms/messages', response: 'Opening your messages.' },
  'my messages': { route: '/lms/messages', response: 'Showing your messages.' },
  'show profile': { route: '/lms/profile', response: 'Opening your profile.' },
  'my profile': { route: '/lms/profile', response: 'Showing your profile.' },
  'enroll now': { route: '/enroll', response: 'Opening enrollment.' },
  'check eligibility': { route: '/enroll', response: 'Opening the eligibility and enrollment flow.' },
  'program holder training': { route: '/program-holder/training', response: 'Opening Program Holder training.' },
  'how to use system': { route: '/program-holder/how-to-use', response: 'Opening the system guide.' },
  'workforce partners': { route: '/partners/workforce', response: 'Opening workforce partners.' },
};

export function VoiceInput({ onCommand, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  const { play, stop, isPlaying, isLoading, error: voiceError } = useNaturalVoice();
  const isSpeaking = isPlaying || isLoading;

  const speak = useCallback((text: string) => {
    void play(text, { voice: 'coral', style: 'assistant', rate: 1 });
  }, [play]);

  const processCommand = useCallback((command: string) => {
    const lowerCommand = command.toLowerCase().trim();

    for (const [key, value] of Object.entries(NAVIGATION_COMMANDS)) {
      if (lowerCommand.includes(key)) {
        speak(value.response);
        window.setTimeout(() => router.push(value.route), 350);
        onCommand?.(command);
        return;
      }
    }

    if (lowerCommand.includes('help') || lowerCommand.includes('what can you do')) {
      speak('I can help you navigate the system. Try saying go to dashboard, show my courses, show programs, my certificates, or my progress.');
      onCommand?.(command);
      return;
    }

    if (lowerCommand.includes('log out') || lowerCommand.includes('sign out')) {
      speak('Logging you out.');
      window.setTimeout(() => router.push('/api/auth/logout'), 350);
      onCommand?.(command);
      return;
    }

    speak("I didn't understand that command. Say help to hear a few commands you can use.");
    onCommand?.(command);
  }, [onCommand, router, speak]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const current = event.resultIndex ?? event.results.length - 1;
      const transcriptText = event.results?.[current]?.[0]?.transcript || '';
      setTranscript(transcriptText);
      if (event.results?.[current]?.isFinal) processCommand(transcriptText);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Recognition may already be stopped.
      }
    };
  }, [processCommand]);

  const toggleListening = () => {
    if (!isSupported) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    stop();
    setTranscript('');
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={isSpeaking}
        className={[
          'relative flex h-14 w-14 items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
          isListening
            ? 'animate-pulse bg-brand-orange-500 hover:bg-brand-orange-600 focus:ring-brand-red-500'
            : 'bg-brand-orange-600 hover:bg-brand-orange-700 focus:ring-brand-blue-500',
          isSpeaking ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
        title={isListening ? 'Stop listening' : 'Start voice command'}
        aria-label={isListening ? 'Stop listening' : 'Start voice command'}
      >
        {isSpeaking ? <Volume2 className="h-7 w-7 text-white" /> : isListening ? <Mic className="h-7 w-7 text-white" /> : <MicOff className="h-7 w-7 text-white" />}
        {isListening ? <span className="absolute inset-0 animate-ping rounded-full bg-brand-orange-500 opacity-75" /> : null}
      </button>
      {transcript ? <div className="max-w-xs text-center text-xs font-medium text-slate-950">“{transcript}”</div> : null}
      {isListening ? <div className="text-xs font-semibold text-slate-700">Listening...</div> : null}
      {voiceError ? <div className="max-w-xs text-center text-xs font-semibold text-red-800">Natural voice is temporarily unavailable.</div> : null}
    </div>
  );
}
