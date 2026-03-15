"use client";

import React from 'react';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface AIInstructorProps {
  instructorName: string;
  avatarUrl?: string;
  message: string;
  autoPlay?: boolean;
  onComplete?: () => void;
}

export default function AIInstructor({
  instructorName,
  avatarUrl = '/avatars/default-instructor.png',
  message,
  autoPlay = false,
  onComplete,
}: AIInstructorProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (autoPlay && message) {
      speak();
    }
  }, [message, autoPlay]);

  const speak = async () => {
    setIsSpeaking(true);

    try {
      // Option 1: Use ElevenLabs API (requires API key)
      if (process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);

          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play().catch(() => {});
          }
        }
      } else {
        // Option 2: Use browser's built-in speech synthesis (free, works offline)
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Start to use a female voice
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(
          (voice) =>
            voice.name.includes('Female') ||
            voice.name.includes('Samantha') ||
            voice.name.includes('Victoria')
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        utterance.onend = () => {
          setIsSpeaking(false);
          if (onComplete) onComplete();
        };

        window.speechSynthesis.speak(utterance);
      }
    } catch (error) { /* Error handled silently */ 
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  return (
    <div className="bg-brand-blue-50 rounded-xl p-6 shadow-lg border-2 border-brand-blue-200">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={`relative w-20 h-20 rounded-full overflow-hidden border-4 ${
              isSpeaking ? 'border-brand-blue-500 animate-pulse' : 'border-gray-300'
            }`}
          >
            <Image alt="AI instructor avatar" loading="lazy"
              src={avatarUrl}
              alt={instructorName}
              fill
              className="object-cover"
              quality={100}
              sizes="100vw"
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                e.currentTarget.src = '/avatars/default-instructor.png';
              }}
            />
            {isSpeaking && (
              <div className="absolute inset-0 bg-white bg-opacity-20 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-ping" />
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-black">{instructorName}</h3>
            <div className="flex gap-2">
              {!isSpeaking ? (
                <button
                  onClick={speak}
                  className="p-2 bg-brand-blue-600 text-white rounded-full hover:bg-brand-blue-700 transition-colors"
                  title="Play audio"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={stopSpeaking}
                  className="p-2 bg-brand-orange-600 text-white rounded-full hover:bg-brand-orange-700 transition-colors"
                  title="Stop audio"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-black leading-relaxed">{message}</p>
          </div>

          {isSpeaking && (
            <div className="mt-2 flex items-center gap-2 text-sm text-brand-blue-600">
              <div className="flex gap-1">
                <div
                  className="w-1 h-4 bg-white rounded animate-pulse"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-1 h-4 bg-white rounded animate-pulse"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-1 h-4 bg-white rounded animate-pulse"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span>Speaking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Hidden audio element for ElevenLabs audio */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsSpeaking(false);
          if (onComplete) onComplete();
        }}
        className="hidden"
      />
    </div>
  );
}
