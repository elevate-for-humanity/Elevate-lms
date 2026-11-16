'use client';

import { useRef } from 'react';
import { useReadOnlyTenantPreview } from './TenantPreviewContext';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import { introductionMediaUrl, TenantRecordedIntroduction } from './TenantRecordedIntroduction';

/** Optional, visitor-controlled media; never starts sound on page load. */
export function TenantIntroduction({ narration, musicUrl, narrator = 'warm', audioUrl }: { narration: string; musicUrl?: string; narrator?: string; audioUrl?: string }) {
  const recording = introductionMediaUrl(audioUrl);
  return recording ? <TenantRecordedIntroduction key={`${recording}:${musicUrl}:${narration}`} narration={narration} audioUrl={recording} musicUrl={introductionMediaUrl(musicUrl)} /> : <TenantSpokenIntroduction key={narration} narration={narration} musicUrl={musicUrl} narrator={narrator} />;
}

function TenantSpokenIntroduction({ narration, musicUrl, narrator }: { narration: string; musicUrl?: string; narrator: string }) {
  const voice = useNaturalVoice();
  const readOnly = useReadOnlyTenantPreview();
  const music = useRef<HTMLAudioElement>(null);
  const approvedMusic = musicUrl && /^\/audio\/[a-z0-9/_-]+\.(mp3|ogg|wav)$/i.test(musicUrl) ? musicUrl : undefined;
  return <div className="tenant-introduction">
    <button type="button" disabled={readOnly || voice.isLoading} onClick={() => {
      if (voice.isPlaying) voice.stop();
      else { music.current?.pause(); void voice.play(narration, { style: 'assistant', voice: narrator }); }
    }}>{voice.isLoading ? 'Preparing introduction…' : voice.isPlaying ? 'Stop introduction' : 'Listen to the introduction'}</button>
    <details><summary>Read the introduction</summary><p>{narration}</p></details>
    {voice.error ? <p role="status">The spoken introduction is temporarily unavailable. You can read it above.</p> : null}
    {approvedMusic && !readOnly ? <label>Optional background music<audio ref={music} src={approvedMusic} controls loop preload="none" onPlay={voice.stop} onLoadedMetadata={event => { event.currentTarget.volume = 0.15; }} /></label> : null}
  </div>;
}
