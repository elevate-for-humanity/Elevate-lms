"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState, useEffect, useRef } from 'react';

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
  className?: string;
  contentId?: string;
}

export default function TextToSpeech({ text, autoPlay = false, className = '', contentId }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [userPrefs, setUserPrefs] = useState<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const supabase = createClient();

  // Load user TTS preferences from DB
  useEffect(() => {
    async function loadPreferences() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('accessibility_preferences')
          .select('tts_rate, tts_pitch, tts_voice')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setUserPrefs(data);
          if (data.tts_rate) setRate(data.tts_rate);
          if (data.tts_pitch) setPitch(data.tts_pitch);
        }
      }
    }
    loadPreferences();
  }, [supabase]);

  // Log TTS usage for analytics
  const logTTSUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('tts_usage_log')
      .insert({
        user_id: user?.id,
        content_id: contentId,
        text_length: text.length,
        used_at: new Date().toISOString()
      });
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Prefer English voices
        const englishVoice = availableVoices.find(voice =>
          voice.lang.startsWith('en') && voice.name.includes('Google')
        ) || availableVoices.find(voice => voice.lang.startsWith('en'));

        setSelectedVoice(englishVoice || availableVoices[0]);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // REMOVED: Auto-play on mount is blocked by browsers
  // TTS must be user-triggered to play with sound
  // Component is now "ready on load" but requires user click

  const handlePlay = () => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      // NO LOOP: Do not restart speech on end
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Play/Pause Button */}
      {!isPlaying && !isPaused && (
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
          title="Listen to this content"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
          <span className="text-sm font-medium">Listen</span>
        </button>
      )}

      {isPlaying && (
        <button
          onClick={handlePause}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          title="Pause"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
          </svg>
          <span className="text-sm font-medium">Pause</span>
        </button>
      )}

      {isPaused && (
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          title="Resume"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
          <span className="text-sm font-medium">Resume</span>
        </button>
      )}

      {/* Stop Button */}
      {(isPlaying || isPaused) && (
        <button
          onClick={handleStop}
          className="p-2 bg-slate-200 text-black rounded-lg hover:bg-slate-300 transition-colors"
          title="Stop"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Speed Control */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-black font-medium">Speed:</label>
        <select
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="text-xs px-2 py-2 border border-slate-300 rounded bg-white"
          disabled={isPlaying}
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>

      {/* Voice Selection */}
      {voices.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-black font-medium">Voice:</label>
          <select
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = voices.find(v => v.name === e.target.value);
              setSelectedVoice(voice || null);
            }}
            className="text-xs px-2 py-2 border border-slate-300 rounded bg-white max-w-[150px]"
            disabled={isPlaying}
          >
            {voices.filter(v => v.lang.startsWith('en')).map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name.split(' ').slice(0, 2).join(' ')}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
