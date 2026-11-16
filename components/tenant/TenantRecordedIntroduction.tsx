'use client';

import { useEffect, useRef, useState } from 'react';
import { useReadOnlyTenantPreview } from './TenantPreviewContext';

/** Customer-supplied media only; never interpret an executable URL as audio. */
export function introductionMediaUrl(value?: string) {
  if (!value || /[\s\\\u0000-\u001f]/.test(value)) return undefined;
  if (/^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? value : undefined;
  } catch { return undefined; }
}

export function TenantRecordedIntroduction({ narration, audioUrl, musicUrl }: {
  narration: string; audioUrl: string; musicUrl?: string;
}) {
  const readOnly = useReadOnlyTenantPreview();
  const voice = useRef<HTMLAudioElement>(null);
  const music = useRef<HTMLAudioElement>(null);
  const attempt = useRef(0);
  const musicWanted = useRef(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'>('idle');
  const [musicEnabled, setMusicEnabled] = useState(false);
  useEffect(() => {
    const spoken = voice.current, bed = music.current;
    return () => { attempt.current++; spoken?.pause(); bed?.pause(); };
  }, []);

  function pause() {
    attempt.current++;
    voice.current?.pause(); music.current?.pause(); setStatus('paused');
  }
  async function play() {
    if (readOnly || !voice.current) return;
    const spoken = voice.current, bed = music.current, version = ++attempt.current;
    if (status === 'ended') { spoken.currentTime = 0; if (bed) bed.currentTime = 0; }
    setStatus('loading');
    try {
      await spoken.play();
      if (version !== attempt.current) { spoken.pause(); return; }
      setStatus('playing');
      if (bed && musicWanted.current) {
        bed.volume = 0.13;
        void bed.play().then(() => { if (version !== attempt.current || !musicWanted.current) bed.pause(); }).catch(() => {
          if (version === attempt.current) { musicWanted.current = false; setMusicEnabled(false); }
        });
      }
    } catch { if (version === attempt.current) { music.current?.pause(); setStatus('error'); } }
  }
  function finish(error = false) {
    attempt.current++; music.current?.pause(); setStatus(error ? 'error' : 'ended');
  }
  return <div className="tenant-introduction">
    <audio ref={voice} src={readOnly ? undefined : audioUrl} preload="none" onEnded={() => finish()} onError={() => finish(true)} />
    {musicUrl ? <audio ref={music} src={readOnly ? undefined : musicUrl} preload="none" loop onError={() => { musicWanted.current = false; setMusicEnabled(false); }} /> : null}
    <button type="button" disabled={readOnly} onClick={() => status === 'playing' || status === 'loading' ? pause() : void play()}>
      {status === 'loading' ? 'Cancel introduction' : status === 'playing' ? 'Pause introduction' : status === 'paused' ? 'Resume introduction' : status === 'ended' ? 'Replay introduction' : 'Listen to the introduction'}
    </button>
    {musicUrl ? <button type="button" disabled={readOnly} aria-pressed={musicEnabled} onClick={() => {
      const enabled = !musicEnabled; musicWanted.current = enabled; setMusicEnabled(enabled);
      const bed = music.current;
      if (!bed) return;
      if (!enabled) bed.pause();
      else if (status === 'playing') {
        bed.volume = 0.13;
        const version = attempt.current;
        void bed.play().then(() => { if (version !== attempt.current || !musicWanted.current) bed.pause(); }).catch(() => { if (version === attempt.current) { musicWanted.current = false; setMusicEnabled(false); } });
      }
    }}>Background music {musicEnabled ? 'on' : 'off'}</button> : null}
    <details><summary>Read the introduction</summary><p>{narration}</p></details>
    <p role="status" className={status === 'error' ? '' : 'sr-only'}>{status === 'error' ? 'The spoken introduction is temporarily unavailable. You can read it above.' : status === 'playing' ? 'Introduction playing.' : status}</p>
  </div>;
}
