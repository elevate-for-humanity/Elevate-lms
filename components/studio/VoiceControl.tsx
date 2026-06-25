'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';

interface VoiceControlProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  showTextResponse?: boolean;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

export default function VoiceControl({
  onTranscript,
  disabled = false,
  className = '',
  showTextResponse = true,
}: VoiceControlProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [speaking, setSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Check for Web Speech API support
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const synthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const startListening = useCallback(async () => {
    if (!speechSupported || disabled) {
      setError('Speech recognition not supported in this browser');
      setState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setState('listening');
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        setLastTranscript(transcript);
        
        if (event.results[0].isFinal) {
          setState('processing');
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error === 'not-allowed' ? 'Microphone access denied' : 'Speech recognition error');
        setState('error');
      };

      recognition.onend = () => {
        if (state === 'listening') {
          setState('idle');
        }
      };

      recognition.start();
      mediaRecorderRef.current = null;

      // Store recognition for cleanup
      (window as any)._currentRecognition = recognition;

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone');
      setState('error');
    }
  }, [speechSupported, disabled, onTranscript, state]);

  const stopListening = useCallback(() => {
    const recognition = (window as any)._currentRecognition;
    if (recognition) {
      recognition.stop();
    }
    setState('idle');
  }, []);

  const speakResponse = useCallback((text: string) => {
    if (!synthesisSupported) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [synthesisSupported]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const recognition = (window as any)._currentRecognition;
      if (recognition) {
        recognition.abort();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Voice Control Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || isProcessing || !speechSupported}
          className={`
            relative flex items-center justify-center w-10 h-10 rounded-full
            transition-all duration-200
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse' 
              : disabled || !speechSupported
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white shadow-lg shadow-brand-blue-500/30'
            }
          `}
          title={!speechSupported ? 'Speech recognition not supported' : isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          
          {/* Pulsing ring when listening */}
          {isListening && (
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75" />
          )}
        </button>

        {/* Status indicator */}
        <div className="text-xs text-slate-500">
          {state === 'idle' && 'Click to speak'}
          {state === 'listening' && 'Listening...'}
          {state === 'processing' && 'Processing...'}
          {state === 'error' && error}
        </div>

        {/* Voice response button */}
        {showTextResponse && aiResponse && (
          <button
            type="button"
            onClick={speaking ? stopSpeaking : () => speakResponse(aiResponse)}
            disabled={!synthesisSupported}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs
              ${speaking
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
              ${!synthesisSupported ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={!synthesisSupported ? 'Text-to-speech not supported' : speaking ? 'Stop speaking' : 'Read response aloud'}
          >
            <Volume2 className="w-3 h-3" />
            {speaking ? 'Stop' : 'Listen'}
          </button>
        )}
      </div>

      {/* Error message */}
      {state === 'error' && error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Last transcript */}
      {lastTranscript && (
        <div className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1">
          You said: <span className="text-slate-700">{lastTranscript}</span>
        </div>
      )}

      {/* AI Response display */}
      {aiResponse && (
        <div className="text-xs text-slate-600 bg-blue-50 rounded px-2 py-1">
          AI: <span className="text-blue-700">{aiResponse.slice(0, 100)}{aiResponse.length > 100 ? '...' : ''}</span>
        </div>
      )}
    </div>
  );
}

// Hook for using voice control
export function useVoiceControl(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setTranscript(text);
      if (event.results[0].isFinal) {
        onTranscript(text);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}
