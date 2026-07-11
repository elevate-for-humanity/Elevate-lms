/**
 * PARIS Voice Command System
 * Natural language voice interface for PARIS operations
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { parisCommand, type ParsedCommand, type CommandIntent } from './dev-studio';

// Voice recognition types
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

// Voice command hooks
export function useVoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message?: string;
    result?: unknown;
    error?: string;
    followUp?: string;
  } | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setLastResult({
        success: false,
        error: 'Speech recognition not supported in this browser',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const latest = results[results.length - 1];
      const text = latest[0].transcript;
      
      setTranscript(text);

      if (latest.isFinal) {
        setIsListening(false);
        
        // Execute the command
        const result = await parisCommand(text);
        setLastResult(result);
        
        // Speak the response if available
        if (result.success && result.result) {
          speakResponse(result.result);
        } else if (result.error) {
          speakResponse({ error: result.error });
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setLastResult({
        success: false,
        error: `Speech recognition error: ${event.error}`,
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    speakResponse({ message: text });
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    lastResult,
    startListening,
    stopListening,
    speak,
  };
}

/**
 * Speak text using Web Speech API
 */
export function speakResponse(data: { message?: string; error?: string; followUp?: string }) {
  if (typeof window === 'undefined') return;
  
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = data.message || data.error || data.followUp || 'Done';
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  // Try to find a good voice
  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.name.includes('Samantha') || 
    v.name.includes('Google') || 
    v.name.includes('Microsoft')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  speechSynthesis.speak(utterance);
}

/**
 * Voice command button component
 */
export function VoiceCommandButton({ 
  onCommand,
  className = '' 
}: { 
  onCommand?: (result: unknown) => void;
  className?: string;
}) {
  const { isListening, transcript, isSupported, lastResult, startListening, stopListening } = useVoiceCommands();

  useEffect(() => {
    if (lastResult && onCommand) {
      onCommand(lastResult);
    }
  }, [lastResult, onCommand]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
          isListening 
            ? 'bg-red-500 animate-pulse' 
            : 'bg-brand-red-600 hover:bg-brand-red-700'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice command'}
      >
        {isListening ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
          </svg>
        )}
      </button>
      
      {isListening && (
        <p className="text-sm text-slate-600 animate-pulse">Listening...</p>
      )}
      
      {transcript && (
        <p className="text-xs text-slate-500 max-w-[200px] truncate">
          &quot;{transcript}&quot;
        </p>
      )}
    </div>
  );
}

/**
 * Voice command chat interface
 */
export function VoiceCommandChat() {
  const { isListening, transcript, isSupported, lastResult, startListening } = useVoiceCommands();
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const result = await parisCommand(input);
    setLastResult(result);
    setInput('');
  };

  if (!isSupported) {
    return (
      <div className="text-center text-slate-500 p-4">
        Voice commands not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-brand-red-600 text-white p-4 flex items-center gap-3">
        <VoiceCommandButton />
        <div>
          <h3 className="font-bold">PARIS Voice Assistant</h3>
          <p className="text-sm opacity-80">Tap the mic and speak your command</p>
        </div>
      </div>

      {/* Transcript/Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transcript && (
          <div className="bg-slate-100 rounded-lg p-3">
            <p className="text-sm font-medium text-slate-600">You said:</p>
            <p className=&quot;text-slate-900&quot;>&quot;{transcript}&quot;</p>
          </div>
        )}
        
        {lastResult && (
          <div className={`rounded-lg p-3 ${lastResult.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className={`text-sm font-medium ${lastResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
              {lastResult.success ? 'Success' : 'Error'}
            </p>
            <p className=&quot;text-slate-900&quot;>
              {lastResult.result && typeof lastResult.result === 'object' 
                ? (lastResult.result as any).message || JSON.stringify(lastResult.result)
                : lastResult.error}
            </p>
            {lastResult.followUp && (
              <p className=&quot;text-sm text-slate-600 mt-2&quot;>{lastResult.followUp}</p>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className=&quot;p-4 border-t&quot;>
        <div className=&quot;flex gap-2&quot;>
          <input
            type=&quot;text&quot;
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder=&quot;Type a command or tap the mic...&quot;
            className=&quot;flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-600&quot;
          />
          <button
            type=&quot;submit&quot;
            className=&quot;px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700&quot;
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Text-to-speech wrapper
 */
export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    voice?: SpeechSynthesisVoice;
  }) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1;
    
    if (options?.voice) {
      utterance.voice = options.voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, voices };
}

// Command examples for voice interface
export const VOICE_COMMAND_EXAMPLES = [
  {
    category: 'Getting Started',
    examples: [
      'Import this GitHub repository',
      'Hire a recruiter agent',
      'Create a marketing campaign',
    ],
  },
  {
    category: 'Content',
    examples: [
      'Generate a video reel about Medical Assistant training',
      'Write social media posts for our new program',
      'Schedule posts for next week',
    ],
  },
  {
    category: 'Agents',
    examples: [
      'Create a customer support agent',
      'Add a grant writing specialist',
      'Train the recruiter on our hiring process',
    ],
  },
  {
    category: 'Code',
    examples: [
      'Analyze this codebase',
      'Connect to the Stripe API',
      'Import the React components',
    ],
  },
];
