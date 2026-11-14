'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import {
  createBrowserSpeechRecognition,
  type BrowserSpeechRecognition,
} from '@/lib/browser/speech-recognition';

interface VoiceDictationButtonProps {
  label: string;
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceDictationButton({
  label,
  onTranscript,
  disabled = false,
  className = '',
}: VoiceDictationButtonProps) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const callbackRef = useRef(onTranscript);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  callbackRef.current = onTranscript;

  useEffect(() => {
    const recognition = createBrowserSpeechRecognition();
    if (!recognition) {
      setSupported(false);
      return;
    }

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const index = event.resultIndex ?? Math.max(0, event.results.length - 1);
      const result = event.results[index];
      const transcript = result?.[0]?.transcript?.trim();
      if (transcript && result?.isFinal !== false) callbackRef.current(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setError(
        event.error === 'not-allowed'
          ? 'Microphone access is blocked. Allow it in browser site settings and try again.'
          : 'Voice input stopped. Press the microphone to try again.',
      );
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // It may already be stopped.
      }
    };
  }, []);

  const toggle = () => {
    const recognition = recognitionRef.current;
    if (!recognition || disabled) return;
    setError(null);
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setError('Voice input could not start. Wait a moment and try again.');
    }
  };

  return (
    <span className={`inline-flex flex-col items-end ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || !supported}
        aria-label={
          supported
            ? `${listening ? 'Stop dictating' : 'Dictate'} ${label}`
            : `Voice input is unavailable for ${label}`
        }
        aria-pressed={listening}
        title={supported ? `Speak ${label}` : 'Voice input is not supported by this browser'}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
          listening
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {listening ? 'Listening…' : 'Speak'}
      </button>
      {error ? (
        <span role="alert" className="mt-1 max-w-xs text-right text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </span>
  );
}
