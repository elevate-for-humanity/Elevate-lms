'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import type { SpeechRecognitionConstructor } from '@/lib/types/external-sdks';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

interface VoiceControlProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  showTextResponse?: boolean;
  responseText?: string;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  _currentRecognition?: {
    stop: () => void;
    abort: () => void;
  };
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: { transcript: string };
    isFinal: boolean;
    length: number;
  };
  length: number;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

export default function VoiceControl({
  onTranscript,
  disabled = false,
  className = '',
  showTextResponse = true,
  responseText = '',
}: VoiceControlProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const naturalVoice = useNaturalVoice();

  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const speaking = naturalVoice.isPlaying || naturalVoice.isPaused || naturalVoice.isLoading;

  const startListening = useCallback(async () => {
    if (!speechSupported || disabled) {
      setError('Speech recognition is not supported in this browser');
      setState('error');
      return;
    }

    try {
      naturalVoice.stop();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const win = window as unknown as SpeechWindow;
      const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!Recognition) return;
      const recognition = new Recognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setState('listening');
        setError(null);
      };
      recognition.onresult = (event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => {
        const results = Array.from(event.results);
        const transcript = results.map((result) => result[0]?.transcript || '').join('');
        setLastTranscript(transcript);
        const latest = results[results.length - 1];
        if (latest?.isFinal) {
          setState('processing');
          onTranscript(transcript);
          setState('idle');
        }
      };
      recognition.onerror = (event: { error: string }) => {
        setError(event.error === 'not-allowed' ? 'Microphone access denied' : 'Speech recognition error');
        setState('error');
      };
      recognition.onend = () => setState((current) => current === 'listening' ? 'idle' : current);
      recognition.start();
      win._currentRecognition = recognition as unknown as SpeechWindow['_currentRecognition'];
    } catch {
      setError('Could not access microphone');
      setState('error');
    }
  }, [disabled, naturalVoice, onTranscript, speechSupported]);

  const stopListening = useCallback(() => {
    const win = window as unknown as SpeechWindow;
    win._currentRecognition?.stop();
    setState('idle');
  }, []);

  const playResponse = useCallback(() => {
    if (!responseText.trim()) return;
    if (speaking) {
      naturalVoice.stop();
      return;
    }
    void naturalVoice.play(responseText.slice(0, 2400), { voice: 'coral', style: 'assistant', rate: 1 });
  }, [naturalVoice, responseText, speaking]);

  useEffect(() => () => {
    const win = window as unknown as SpeechWindow;
    win._currentRecognition?.abort();
  }, []);

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || isProcessing || !speechSupported}
          className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
            isListening
              ? 'animate-pulse bg-red-600 text-white shadow-lg shadow-red-500/30'
              : disabled || !speechSupported
                ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                : 'bg-brand-blue-700 text-white shadow-lg shadow-brand-blue-500/30 hover:bg-brand-blue-800'
          }`}
          title={!speechSupported ? 'Speech recognition not supported' : isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          {isListening ? <span className="absolute inset-0 animate-ping rounded-full border-2 border-red-400 opacity-75" /> : null}
        </button>

        <div className="text-xs font-medium text-slate-700">
          {state === 'idle' && 'Click to speak'}
          {state === 'listening' && 'Listening...'}
          {state === 'processing' && 'Processing...'}
          {state === 'error' && error}
        </div>

        {showTextResponse && responseText ? (
          <button
            type="button"
            onClick={playResponse}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${speaking ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
            title={speaking ? 'Stop natural voice' : 'Read response with natural AI voice'}
          >
            {naturalVoice.isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
            {naturalVoice.isLoading ? 'Preparing' : speaking ? 'Stop' : 'Listen'}
          </button>
        ) : null}
      </div>

      {state === 'error' && error ? (
        <div className="flex items-center gap-1 text-xs font-semibold text-red-800"><AlertCircle className="h-3 w-3" />{error}</div>
      ) : null}

      {lastTranscript ? (
        <div className="rounded bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">You said: <span className="text-slate-950">{lastTranscript}</span></div>
      ) : null}

      {responseText ? (
        <div className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-slate-800">AI: <span className="text-blue-900">{responseText.slice(0, 100)}{responseText.length > 100 ? '...' : ''}</span></div>
      ) : null}

      {naturalVoice.error ? <div className="text-xs font-semibold text-red-800">Natural voice is temporarily unavailable.</div> : null}
    </div>
  );
}

export function useVoiceControl(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionConstructor | null>(null);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as SpeechWindow;
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = Array.from(event.results).map((result) => result[0].transcript).join('');
      setTranscript(text);
      if (event.results[0].isFinal) onTranscript(text);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening };
}
