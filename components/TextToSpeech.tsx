'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef, useState } from 'react';

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
  className?: string;
  contentId?: string;
}

export default function TextToSpeech({
  text,
  autoPlay = false,
  className = '',
  contentId,
}: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadPreferences() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('accessibility_preferences')
        .select('tts_rate, tts_pitch, tts_voice')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.tts_rate) setRate(data.tts_rate);
      if (data?.tts_pitch) setPitch(data.tts_pitch);
    }
    void loadPreferences();
  }, [supabase]);

  const logTTSUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('tts_usage_log').insert({
      user_id: user?.id,
      content_id: contentId,
      text_length: text.length,
      used_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const englishVoice =
        availableVoices.find((voice) => voice.lang.startsWith('en') && voice.name.includes('Google')) ||
        availableVoices.find((voice) => voice.lang.startsWith('en')) ||
        availableVoices[0] ||
        null;
      setSelectedVoice(englishVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

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
      void logTTSUsage();
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  return (
    <div
      className={`relative z-0 inline-flex w-fit max-w-full flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg bg-white/95 p-1.5 ${className}`}
      data-tts-control
    >
      {!isPlaying && !isPaused && (
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-brand-blue-600 px-3 py-1.5 text-white transition-colors hover:bg-brand-blue-700"
          title="Listen to this content"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
          <span className="text-sm font-semibold">Listen</span>
        </button>
      )}

      {isPlaying && (
        <button type="button" onClick={handlePause} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-brand-orange-600 px-3 py-1.5 text-white hover:bg-brand-orange-700" title="Pause">
          <span className="text-sm font-semibold">Pause</span>
        </button>
      )}

      {isPaused && (
        <button type="button" onClick={handlePlay} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-brand-green-600 px-3 py-1.5 text-white hover:bg-brand-green-700" title="Resume">
          <span className="text-sm font-semibold">Resume</span>
        </button>
      )}

      {(isPlaying || isPaused) && (
        <button type="button" onClick={handleStop} className="min-h-9 shrink-0 rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-300" title="Stop">
          Stop
        </button>
      )}

      <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-800">
        <span>Speed</span>
        <select
          value={rate}
          onChange={(event) => setRate(Number(event.target.value))}
          className="min-h-9 shrink-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900"
          disabled={isPlaying}
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </label>

      {voices.length > 0 && (
        <label className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-800 sm:flex">
          <span className="shrink-0">Voice</span>
          <select
            value={selectedVoice?.name || ''}
            onChange={(event) => setSelectedVoice(voices.find((voice) => voice.name === event.target.value) || null)}
            className="min-h-9 w-44 shrink-0 truncate rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 lg:w-52"
            disabled={isPlaying}
          >
            {voices.filter((voice) => voice.lang.startsWith('en')).map((voice) => (
              <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
