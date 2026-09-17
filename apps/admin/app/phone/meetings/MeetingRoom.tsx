'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';

type Connection = { token: string; serverUrl: string };

export function MeetingRoom({ roomId }: { roomId: string }) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`/api/communications/meetings/${roomId}/token`, { method: 'POST' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to join this meeting.');
        if (active) setConnection(body);
      })
      .catch(
        (reason) =>
          active && setError(reason instanceof Error ? reason.message : 'Unable to join.'),
      );
    return () => {
      active = false;
    };
  }, [roomId]);

  if (error) return <div className="rounded-xl bg-red-50 p-5 font-bold text-red-800">{error}</div>;
  if (!connection)
    return <div className="rounded-xl bg-slate-100 p-5">Preparing the secure room…</div>;

  return (
    <div
      className="h-[72vh] min-h-[520px] overflow-hidden rounded-2xl bg-slate-950"
      data-lk-theme="default"
    >
      <LiveKitRoom
        token={connection.token}
        serverUrl={connection.serverUrl}
        connect
        audio
        video
        className="h-full"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
