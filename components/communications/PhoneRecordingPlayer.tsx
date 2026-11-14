'use client';
import { useRef, useState } from 'react';
import { AudioOutputControl } from './AudioOutputControl';
export function PhoneRecordingPlayer({ url }: { url: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState(false);
  return (
    <div className="mt-3">
      <audio
        ref={audio}
        controls
        playsInline
        preload="none"
        src={url}
        className="w-full"
        aria-label="Play voicemail or call recording"
        onPlay={() => {
          if (audio.current) {
            audio.current.muted = false;
            if (audio.current.volume === 0) audio.current.volume = 1;
          }
          setError(false);
        }}
        onError={() => setError(true)}
      />
      <AudioOutputControl audio={audio} />
      {error && (
        <div role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-900">
          <p>
            This recording could not be loaded. It may have expired or be temporarily unavailable.
          </p>
          <button
            type="button"
            className="mt-2 min-h-11 rounded-lg border px-3 font-bold"
            onClick={() => {
              setError(false);
              audio.current?.load();
            }}
          >
            Retry audio
          </button>
        </div>
      )}
    </div>
  );
}
