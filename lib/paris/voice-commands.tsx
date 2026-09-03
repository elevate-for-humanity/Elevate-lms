/**
 * PARIS Voice Command System
 * Natural-language voice input with shared natural-TTS spoken responses.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { parisCommand } from './dev-studio';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type VoiceCommandResult = {
  success: boolean;
  message?: string;
  result?: unknown;
  error?: string;
  followUp?: string;
};

function responseText(data: { message?: string; error?: string; followUp?: string; result?: unknown }) {
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (data.followUp) return data.followUp;
  if (data.result && typeof data.result === 'object' && 'message' in (data.result as Record<string, unknown>)) {
    return String((data.result as Record<string, unknown>).message || 'Done');
  }
  if (typeof data.result === 'string') return data.result;
  return 'Done';
}

export function useVoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const naturalVoice = useNaturalVoice();

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(Recognition));
  }, []);

  const execute = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) return null;
    const result = await parisCommand(clean);
    const normalized: VoiceCommandResult = result;
    setLastResult(normalized);
    const spoken = responseText(normalized);
    void naturalVoice.play(spoken.slice(0, 2400), { voice: 'coral', style: 'assistant', rate: 1 });
    return normalized;
  }, [naturalVoice]);

  const startListening = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setLastResult({ success: false, error: 'Speech recognition is not supported in this browser.' });
      return;
    }

    naturalVoice.stop();
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const latest = results[results.length - 1];
      const text = latest?.[0]?.transcript || '';
      setTranscript(text);
      if (latest?.isFinal) {
        setIsListening(false);
        void execute(text);
      }
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setLastResult({ success: false, error: `Speech recognition error: ${event.error}` });
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [execute, naturalVoice]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    void naturalVoice.play(text.slice(0, 2400), { voice: 'coral', style: 'assistant', rate: 1 });
  }, [naturalVoice]);

  return {
    isListening,
    transcript,
    isSupported,
    lastResult,
    startListening,
    stopListening,
    execute,
    speak,
    stopSpeaking: naturalVoice.stop,
    isSpeaking: naturalVoice.isPlaying || naturalVoice.isLoading,
    voiceError: naturalVoice.error,
  };
}

export function VoiceCommandButton({
  onCommand,
  className = '',
}: {
  onCommand?: (result: unknown) => void;
  className?: string;
}) {
  const { isListening, transcript, isSupported, lastResult, startListening, stopListening } = useVoiceCommands();

  useEffect(() => {
    if (lastResult && onCommand) onCommand(lastResult);
  }, [lastResult, onCommand]);

  if (!isSupported) return null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
          isListening ? 'animate-pulse bg-red-600' : 'bg-brand-red-600 hover:bg-brand-red-700'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice command'}
      >
        {isListening ? (
          <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
          </svg>
        )}
      </button>
      {isListening ? <p className="animate-pulse text-sm font-semibold text-slate-700">Listening...</p> : null}
      {transcript ? <p className="max-w-[200px] truncate text-xs font-medium text-slate-700">“{transcript}”</p> : null}
    </div>
  );
}

export function VoiceCommandChat() {
  const {
    isListening,
    transcript,
    isSupported,
    lastResult,
    startListening,
    execute,
    voiceError,
  } = useVoiceCommands();
  const [input, setInput] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    await execute(input);
    setInput('');
  };

  if (!isSupported) {
    return <div className="p-4 text-center font-medium text-slate-700">Voice input is not supported in this browser. Type a command instead.</div>;
  }

  return (
    <div className="flex h-[400px] flex-col overflow-hidden rounded-lg bg-white shadow-lg">
      <div className="flex items-center gap-3 bg-brand-red-600 p-4 text-white">
        <VoiceCommandButton />
        <div>
          <h3 className="font-bold text-white">PARIS Voice Assistant</h3>
          <p className="text-sm font-medium text-white">Tap the mic and speak your command</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {isListening ? <p className="font-semibold text-slate-700">Listening…</p> : null}
        {transcript ? (
          <div className="rounded-lg bg-slate-100 p-3">
            <p className="text-sm font-semibold text-slate-700">You said:</p>
            <p className="font-medium text-slate-950">“{transcript}”</p>
          </div>
        ) : null}
        {lastResult ? (
          <div className={`rounded-lg p-3 ${lastResult.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className={`text-sm font-bold ${lastResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
              {lastResult.success ? 'Success' : 'Error'}
            </p>
            <p className="font-medium text-slate-950">{responseText(lastResult)}</p>
            {lastResult.followUp ? <p className="mt-2 text-sm font-medium text-slate-700">{lastResult.followUp}</p> : null}
          </div>
        ) : null}
        {voiceError ? <p className="text-sm font-semibold text-red-800">Spoken response is unavailable in this browser; command results remain visible above.</p> : null}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-300 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a command or tap the mic..."
            className="flex-1 rounded-lg border border-slate-400 px-4 py-2 font-medium text-slate-950 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-brand-red-600"
          />
          <button type="submit" className="rounded-lg bg-brand-red-600 px-4 py-2 font-bold text-white hover:bg-brand-red-700">Send</button>
        </div>
      </form>
    </div>
  );
}

/** Compatibility hook retained for existing call sites; playback uses the shared natural voice engine. */
export function useSpeech() {
  const naturalVoice = useNaturalVoice();
  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number; voice?: SpeechSynthesisVoice }) => {
    void naturalVoice.play(text.slice(0, 2400), {
      voice: 'coral',
      style: 'assistant',
      rate: options?.rate || 1,
    });
  }, [naturalVoice]);

  return {
    speak,
    stop: naturalVoice.stop,
    isSpeaking: naturalVoice.isPlaying || naturalVoice.isLoading,
    voices: [] as SpeechSynthesisVoice[],
  };
}

export const VOICE_COMMAND_EXAMPLES = [
  { category: 'Getting Started', examples: ['Import this GitHub repository', 'Hire a recruiter agent', 'Create a marketing campaign'] },
  { category: 'Content', examples: ['Generate a video reel about Medical Assistant training', 'Write social media posts for our new program', 'Schedule posts for next week'] },
  { category: 'Agents', examples: ['Create a customer support agent', 'Add a grant writing specialist', 'Train the recruiter on our hiring process'] },
  { category: 'Code', examples: ['Analyze this codebase', 'Connect to the Stripe API', 'Import the React components'] },
];
