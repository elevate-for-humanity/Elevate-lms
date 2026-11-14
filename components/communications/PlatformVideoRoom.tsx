'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, StartAudio, VideoConference, useConnectionState } from '@livekit/components-react';
import { VideoCallingGuide } from './VideoCallingGuide';
import { MeetingScreenShare } from './MeetingScreenShare';

function ConnectionStatus() {
  const state = useConnectionState();
  return <p role="status" className="bg-slate-800 px-4 py-2 text-sm font-bold text-white">Meeting connection: {state}</p>;
}

/** All portals use the same connection lifecycle; authorization stays in their token endpoints. */
function VideoRoomConnection({ tokenEndpoint, allowScreenShare = true }: { tokenEndpoint: string; allowScreenShare?: boolean }) {
  const [joined, setJoined] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [connection, setConnection] = useState<{ token: string; serverUrl: string; canShare?: boolean } | null>(null);
  const [error, setError] = useState('');
  const [mediaError, setMediaError] = useState('');

  useEffect(() => {
    if (!joined) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let active = true;
    fetch(tokenEndpoint, { method: 'POST', signal: controller.signal })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Unable to join this meeting.');
        if (!body.token || !body.serverUrl) throw new Error('The meeting service returned an incomplete connection.');
        if (active) setConnection(body);
      })
      .catch(cause => {
        if (active) setError(cause.name === 'AbortError' ? 'The meeting service did not respond. Check your connection and retry.' : cause.message || 'Unable to join this meeting.');
      })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [tokenEndpoint, joined, attempt]);

  function retry() { setConnection(null); setError(''); setMediaError(''); setAttempt(value => value + 1); setJoined(true); }
  if (error) return <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-5 font-bold text-red-800"><p>{error}</p><button type="button" onClick={retry} className="min-h-11 rounded-lg border border-red-300 px-4">Retry meeting connection</button></div>;
  if (!joined) return <section className="space-y-3 rounded-xl border bg-white p-5"><h2 className="text-lg font-bold">Ready to join?</h2><p>Join with your camera and microphone off. Use the meeting controls to turn them on and choose your devices. Screen sharing requires a supported desktop browser.</p><button type="button" onClick={() => setJoined(true)} className="min-h-11 rounded-lg bg-indigo-700 px-5 font-bold text-white">Join meeting</button></section>;
  if (!connection) return <p role="status" className="rounded-xl bg-slate-100 p-5">Preparing the secure room…</p>;

  return <div className="min-h-[420px] w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-slate-950" data-lk-theme="default">
    <LiveKitRoom key={`${tokenEndpoint}-${attempt}`} token={connection.token} serverUrl={connection.serverUrl} connect audio={false} video={false}
      onError={cause => setError(cause.message || 'The meeting connection failed. Please retry.')}
      onDisconnected={() => { setConnection(null); setJoined(false); setMediaError(''); }}
      onMediaDeviceFailure={failure => setMediaError(failure === 'NotFound' ? 'No camera or microphone was found. Connect a device and select it in the meeting controls. You can stay in the meeting without it.' : 'Camera or microphone access failed. Check browser permissions and select an available device. You can stay in the meeting without it.')}
      className="flex min-h-[420px] min-w-0 max-w-full flex-col overflow-hidden">
      <ConnectionStatus />
      {mediaError ? <p role="alert" className="bg-amber-100 p-3 text-sm font-bold text-amber-950">{mediaError}</p> : null}
      <div className="flex flex-wrap items-center gap-3 p-3"><MeetingScreenShare allowed={allowScreenShare && connection.canShare !== false} /><StartAudio label="Enable meeting audio" /></div>
      <div className="h-[65dvh] min-h-[360px]"><VideoConference /></div>
      <RoomAudioRenderer />
    </LiveKitRoom>
  </div>;
}

export function PlatformVideoRoom(props: Parameters<typeof VideoRoomConnection>[0]) {
  return <div className="space-y-4"><VideoCallingGuide compact /><VideoRoomConnection {...props} /></div>;
}
