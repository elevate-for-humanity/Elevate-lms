'use client';

import { useRef } from 'react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

/** Optional, visitor-controlled media; never starts sound on page load. */
export function TenantIntroduction({ narration, musicUrl }: { narration: string; musicUrl?: string }) {
  const voice = useNaturalVoice();
  const music = useRef<HTMLAudioElement>(null);
  const approvedMusic = musicUrl && /^\/audio\/[a-z0-9/_-]+\.(mp3|ogg|wav)$/i.test(musicUrl) ? musicUrl : undefined;
  return <div className="tenant-introduction">
    <button type="button" disabled={voice.isLoading} onClick={() => {
      if (voice.isPlaying) voice.stop();
      else { music.current?.pause(); void voice.play(narration, { style: 'assistant', voice: 'coral' }); }
    }}>{voice.isLoading ? 'Preparing introduction…' : voice.isPlaying ? 'Stop introduction' : 'Listen to the introduction'}</button>
    <details><summary>Read the introduction</summary><p>{narration}</p></details>
    {voice.error ? <p role="status">The spoken introduction is temporarily unavailable. You can read it above.</p> : null}
    {approvedMusic ? <label>Optional background music<audio ref={music} src={approvedMusic} controls loop preload="none" onPlay={voice.stop} onLoadedMetadata={event => { event.currentTarget.volume = 0.15; }} /></label> : null}
  </div>;
}
