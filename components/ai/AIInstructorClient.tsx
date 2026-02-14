"use client";

import React from 'react';

import { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface AIInstructorClientProps {
  lessonTitle?: string;
  context?: 'lesson' | 'quiz' | 'certificate' | 'general';
  autoSpeak?: boolean;
}

export function AIInstructorClient({
  lessonTitle,
  context = 'general',
  autoSpeak = true
}: AIInstructorClientProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string) => {
    if (isMuted || !autoSpeak) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsVisible(true);
      setCurrentMessage(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Keep visible for a few seconds after speaking
      setTimeout(() => {
        if (!isSpeaking) {
          setIsVisible(false);
        }
      }, 3000);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  useEffect(() => {
    // Listen for custom events to trigger AI instructor
    const handleSpeakEvent = (event: CustomEvent) => {
      const { message } = event.detail;
      speak(message);
    };

    window.addEventListener('ai-instructor-speak', handleSpeakEvent as EventListener);

    // Initial welcome message
    if (autoSpeak && lessonTitle) {
      setTimeout(() => {
        speak(`Welcome to ${lessonTitle}. I'm here to guide you through this lesson.`);
      }, 2000);
    }

    return () => {
      window.removeEventListener('ai-instructor-speak', handleSpeakEvent as EventListener);
      window.speechSynthesis.cancel();
    };
  }, [lessonTitle, autoSpeak]);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0"
        onClick={() => setIsVisible(true)}
      >
        <Volume2 className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full    flex items-center justify-center">
              <span className="text-white text-lg">🎓</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Instructor</h3>
              <p className="text-xs text-muted-foreground">
                {isSpeaking ? 'Speaking...' : 'Ready to help'}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0"
              onClick={() => {
                stopSpeaking();
                setIsVisible(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {currentMessage && (
          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="text-foreground">{currentMessage}</p>
          </div>
        )}

        {isSpeaking && (
          <div className="mt-3 flex justify-center">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-brand-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-4 bg-brand-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-4 bg-brand-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {isSpeaking && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={stopSpeaking}
          >
            Stop Speaking
          </Button>
        )}
      </div>
    </Card>
  );
}
