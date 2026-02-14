"use client";

import React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VoiceInputProps {
  onCommand?: (command: string) => void;
  className?: string;
}

export function VoiceInput({ onCommand, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as string).SpeechRecognition ||
        (window as string).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (data: any) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          setTranscript(transcriptText);

          // If final result, process command
          if (event.results[current].isFinal) {
            processCommand(transcriptText);
          }
        };

        recognitionRef.current.onerror = (data: any) => {
          // Error logged
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const processCommand = (command: string) => {
    const lowerCommand = command.toLowerCase().trim();

    // Navigation commands
    const navigationCommands: Record<
      string,
      { route: string; response: string }
    > = {
      'go to dashboard': {
        route: '/lms/dashboard',
        response: 'Navigating to dashboard',
      },
      'open dashboard': {
        route: '/lms/dashboard',
        response: 'Opening dashboard',
      },
      'show my courses': {
        route: '/lms/courses',
        response: 'Showing your courses',
      },
      'go to courses': {
        route: '/lms/courses',
        response: 'Going to courses',
      },
      'show programs': {
        route: '/programs',
        response: 'Showing available programs',
      },
      'go to programs': {
        route: '/programs',
        response: 'Going to programs',
      },
      'show certificates': {
        route: '/lms/certificates',
        response: 'Showing your certificates',
      },
      'my certificates': {
        route: '/lms/certificates',
        response: 'Opening certificates',
      },
      'show progress': {
        route: '/lms/progress',
        response: 'Showing your progress',
      },
      'my progress': {
        route: '/lms/progress',
        response: 'Opening progress page',
      },
      'go home': {
        route: '/',
        response: 'Going to home page',
      },
      'go to home': {
        route: '/',
        response: 'Navigating to home',
      },
      'show messages': {
        route: '/lms/messages',
        response: 'Opening messages',
      },
      'my messages': {
        route: '/lms/messages',
        response: 'Showing your messages',
      },
      'show profile': {
        route: '/lms/profile',
        response: 'Opening your profile',
      },
      'my profile': {
        route: '/lms/profile',
        response: 'Showing your profile',
      },
      'enroll now': {
        route: '/enroll',
        response: 'Opening enrollment page',
      },
      'check eligibility': {
        route: '/enroll',
        response: 'Checking eligibility',
      },
      'program holder training': {
        route: '/program-holder/training',
        response: 'Opening program holder training',
      },
      'how to use system': {
        route: '/program-holder/how-to-use',
        response: 'Opening system guide',
      },
      'workforce partners': {
        route: '/partners/workforce',
        response: 'Opening workforce partners page',
      },
    };

    // Check for exact matches first
    for (const [key, value] of Object.entries(navigationCommands)) {
      if (lowerCommand.includes(key)) {
        speak(value.response);
        setTimeout(() => {
          router.push(value.route);
        }, 500);
        if (onCommand) onCommand(command);
        return;
      }
    }

    // Action commands
    if (
      lowerCommand.includes('help') ||
      lowerCommand.includes('what can you do')
    ) {
      speak(
        'I can help you navigate the system. Try saying: go to dashboard, show my courses, show programs, my certificates, or my progress.'
      );
      if (onCommand) onCommand(command);
      return;
    }

    if (lowerCommand.includes('log out') || lowerCommand.includes('sign out')) {
      speak('Logging you out');
      setTimeout(() => {
        router.push('/api/auth/logout');
      }, 500);
      if (onCommand) onCommand(command);
      return;
    }

    // If no command matched
    speak(
      "I didn't understand that command. Try saying 'help' to see what I can do."
    );
    if (onCommand) onCommand(command);
  };

  const toggleListening = () => {
    if (!isSupported) {
      alert(
        'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
      speak('Listening');
    }
  };

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={toggleListening}
        disabled={isSpeaking}
        className={[
          'relative w-14 h-14 rounded-full flex items-center justify-center transition-all',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          isListening
            ? 'bg-brand-orange-500 hover:bg-brand-orange-600 focus:ring-red-500 animate-pulse'
            : 'bg-brand-orange-600 hover:bg-brand-orange-700 focus:ring-brand-blue-500',
          isSpeaking ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
        title={isListening ? 'Stop listening' : 'Start voice command'}
      >
        {isSpeaking ? (
          <Volume2 className="h-10 w-10 text-white" />
        ) : isListening ? (
          <Mic className="h-10 w-10 text-white" />
        ) : (
          <MicOff className="h-10 w-10 text-white" />
        )}
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-brand-orange-500 animate-ping opacity-75" />
        )}
      </button>
      {transcript && (
        <div className="text-xs text-black max-w-xs text-center">
          "{transcript}"
        </div>
      )}
      {isListening && <div className="text-xs text-gray-500">Listening...</div>}
    </div>
  );
}
