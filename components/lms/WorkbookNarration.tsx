'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import { narrationChunks } from '@/lib/lms/workbook-slides';

export default function WorkbookNarration({ text }: { text: string }) {
  const { play, stop, pause, resume, isPlaying, isPaused, isLoading, error } = useNaturalVoice();
  const [guided, setGuided] = useState(false);
  const [caption, setCaption] = useState('');
  const generation = useRef(0);
  const narrate = useCallback(() => {
    const run = ++generation.current;
    const chunks = narrationChunks(text);
    const read = (index: number) => {
      if (run !== generation.current || index >= chunks.length) return;
      setCaption(chunks[index]);
      void play(chunks[index], { style: 'instructor', onEnded: () => read(index + 1) });
    };
    read(0);
  }, [play, text]);

  useEffect(() => {
    setCaption('');
    if (guided) narrate();
    return () => {
      generation.current += 1;
      stop();
    };
  }, [guided, narrate, stop]);

  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        generation.current += 1;
        stop();
        setGuided(false);
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [stop]);

  return (
    <aside
      aria-label="PARIS narration"
      className="my-5 rounded-2xl border border-stone-300 bg-white p-4 text-stone-950"
    >
      <p className="font-bold">PARIS · Your workbook guide</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            if (isPlaying) pause();
            else if (isPaused)
              void resume().catch(() => {
                setGuided(false);
              });
            else if (!guided) setGuided(true);
            else narrate();
          }}
          className="min-h-12 rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {isLoading
            ? 'Preparing narration…'
            : isPlaying
              ? 'Pause PARIS'
              : isPaused
                ? 'Resume PARIS'
                : 'Listen with PARIS'}
        </button>
        <button
          type="button"
          onClick={() => {
            stop();
            if (!guided) setGuided(true);
            else narrate();
          }}
          className="min-h-12 rounded-lg border border-stone-400 px-4 py-3"
        >
          Replay narration
        </button>
        <button
          type="button"
          onClick={() => {
            generation.current += 1;
            stop();
            setGuided(false);
            setCaption('');
          }}
          className="min-h-12 rounded-lg border border-stone-400 px-4 py-3"
        >
          Turn narration off
        </button>
      </div>
      <p className="mt-3 text-sm">
        Once started, PARIS reads each screen as you move through it, then waits while you write.
        Your private answers are never read aloud.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-red-700">
          Narration is unavailable. Choose Listen with PARIS to retry. Your answers remain
          available.
        </p>
      )}
      <details className="mt-3" open={!!caption}>
        <summary className="cursor-pointer py-2 font-semibold">Narration transcript</summary>
        <p className="mt-2 leading-relaxed" aria-live="off">
          {caption || text}
        </p>
      </details>
    </aside>
  );
}
