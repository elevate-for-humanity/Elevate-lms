'use client';

import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import { useEffect, useState } from 'react';

type Connection = { token: string; serverUrl: string };

export function ProgramHolderMeetingRoom({
  roomId,
  tokenEndpoint = `/api/program-holder/meetings/${roomId}/token`,
}: {
  roomId: string;
  tokenEndpoint?: string;
}) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [mediaError, setMediaError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(tokenEndpoint, { method: 'POST' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to join this meeting.');
        if (active) setConnection(body);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to join.');
      });
    return () => {
      active = false;
    };
  }, [tokenEndpoint, attempt]);

  if (error) return <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-5 font-bold text-red-800"><p>{error}</p><button type="button" onClick={() => { setConnection(null); setError(''); setMediaError(''); setAttempt(value => value + 1); }} className="min-h-11 rounded-lg border border-red-300 px-4">Retry meeting connection</button></div>;
  if (!connection)
    return <div className="rounded-xl bg-slate-100 p-5">Preparing the secure room…</div>;

  return (
    <div
      className="h-[min(72dvh,760px)] min-h-[420px] w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-slate-950 sm:min-h-[520px]"
      data-lk-theme="default"
    >
      <LiveKitRoom
        token={connection.token}
        serverUrl={connection.serverUrl}
        connect
        onError={(cause) => setError(cause.message || 'The meeting connection failed. Please retry.')}
        onMediaDeviceFailure={() => setMediaError('Camera or microphone access failed. Check browser permissions and your selected devices, then use the room controls to try again.')}
        audio
        video
        className="h-full min-w-0 max-w-full overflow-hidden"
      >
        {mediaError ? <p role="alert" className="bg-amber-100 p-3 text-sm font-bold text-amber-950">{mediaError}</p> : null}
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
