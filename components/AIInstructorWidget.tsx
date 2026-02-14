"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Volume2, VolumeX } from 'lucide-react';

interface AIInstructorWidgetProps {
  programId?: string;
  lessonId?: string;
  context?: 'welcome' | 'lesson' | 'encouragement' | 'completion';
}

export function AIInstructorWidget({
  programId,
  lessonId,
  context = 'welcome',
}: AIInstructorWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMessage();
    }
  }, [isOpen, context, programId, lessonId]);

  const fetchMessage = async () => {
    try {
      const response = await fetch('/api/ai-instructor/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId, lessonId, context }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (data.audioUrl && !muted) {
        playAudio(data.audioUrl);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      setMessage('Hi! I\'m here to help you succeed in your training. Feel free to ask me anything!');
    }
  };

  const playAudio = (url: string) => {
    setSpeaking(true);
    const audio = new Audio(url);
    audio.onended = () => setSpeaking(false);
    audio.play().catch(() => setSpeaking(false));
  };

  const contextMessages = {
    welcome: 'Welcome! I\'m your AI instructor. I\'m here to guide you through your training journey and answer any questions you have.',
    lesson: 'Let\'s dive into this lesson! Take your time, and remember - I\'m here if you need help understanding anything.',
    encouragement: 'You\'re doing great! Keep up the excellent work. Remember, every step forward is progress.',
    completion: 'Congratulations on completing this module! You\'ve worked hard and it shows. Ready for the next challenge?',
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16    rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 animate-pulse"
          aria-label="Open AI Instructor"
        >
          <MessageCircle className="w-8 h-8 text-white" />
          {speaking && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
          )}
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="   p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
                {speaking && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">Your AI Instructor</h3>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMuted(!muted)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="bg-brand-blue-50 rounded-2xl p-4 relative">
              <div className="absolute -top-2 left-6 w-4 h-4 bg-brand-blue-50 transform rotate-45" />
              <p className="text-black leading-relaxed">
                {message || contextMessages[context]}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => fetchMessage()}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-black transition-colors"
              >
                💡 Give me a tip
              </button>
              <button
                onClick={() => setMessage('Remember: Learning takes time. Don\'t rush through the material. Take breaks when needed, and review concepts until they click. You\'ve got this!')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-black transition-colors"
              >
                🎯 Study tips
              </button>
              <button
                onClick={() => setMessage('If you\'re stuck, try: 1) Re-read the material slowly, 2) Take notes in your own words, 3) Ask for help from your instructor, 4) Practice with real examples. Every expert was once a beginner!')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-black transition-colors"
              >
                ❓ I need help
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t text-center">
            <p className="text-xs text-gray-500">
              Automated learning support • Available 24/7
            </p>
          </div>
        </div>
      )}
    </>
  );
}
