'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

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
  const [rate, setRate] = useState(1);
  const naturalVoice = useNaturalVoice();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadPreferences() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('accessibility_preferences')
        .select('tts_rate')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.tts_rate) setRate(Number(data.tts_rate));
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

  const handlePlay = async () => {
    if (!text.trim()) return;
    if (naturalVoice.isPaused) {
      const resumed = await naturalVoice.resume();
      if (resumed) void logTTSUsage();
      return;
    }

    const started = await naturalVoice.play(text, {
      voice: 'coral',
      style: 'instructor',
      rate,
    });
    if (started) void logTTSUsage();
  };

  useEffect(() => {
    if (!autoPlay || !text.trim()) return;
    const timer = window.setTimeout(() => {
      void handlePlay();
    }, 400);
    return () => window.clearTimeout(timer);
    // Auto play only when the supplied content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text]);

  if (!text.trim()) return null;

  return (
    <div
      className={`relative z-0 inline-flex w-auto max-w-full flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap bg-transparent p-0 sm:gap-2 sm:rounded-lg sm:bg-white/95 sm:p-1.5 ${className}`}
      data-tts-control
    >
      {!naturalVoice.isPlaying && !naturalVoice.isPaused && (
        <button
          type="button"
          onClick={() => void handlePlay()}
          disabled={naturalVoice.isLoading}
          className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-brand-blue-700 px-3 py-1.5 text-white transition-colors hover:bg-brand-blue-800 disabled:opacity-60"
          title="Listen with natural AI narration"
        >
          {naturalVoice.isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          )}
          <span className="text-sm font-semibold">{naturalVoice.isLoading ? 'Preparing…' : 'Listen'}</span>
        </button>
      )}

      {naturalVoice.isPlaying && (
        <button type="button" onClick={naturalVoice.pause} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-brand-orange-600 px-3 py-1.5 text-white hover:bg-brand-orange-700" title="Pause">
          <span className="text-sm font-semibold">Pause</span>
        </button>
      )}

      {naturalVoice.isPaused && (
        <button type="button" onClick={() => void naturalVoice.resume()} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-brand-green-600 px-3 py-1.5 text-white hover:bg-brand-green-700" title="Resume">
          <span className="text-sm font-semibold">Resume</span>
        </button>
      )}

      {(naturalVoice.isPlaying || naturalVoice.isPaused) && (
        <button type="button" onClick={naturalVoice.stop} className="min-h-9 shrink-0 rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-300" title="Stop">
          Stop
        </button>
      )}

      <label className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-800 sm:flex">
        <span>Speed</span>
        <select
          value={rate}
          onChange={(event) => setRate(Number(event.target.value))}
          className="min-h-9 shrink-0 rounded-md border border-slate-400 bg-white px-2 text-xs text-slate-950"
          disabled={naturalVoice.isPlaying}
        >
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
        </select>
      </label>

      <span className="hidden text-xs font-semibold text-slate-700 md:inline">Natural AI voice</span>
      {naturalVoice.error ? <span className="text-xs font-semibold text-red-700">{naturalVoice.error}</span> : null}
    </div>
  );
}
