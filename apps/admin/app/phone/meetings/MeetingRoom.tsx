'use client';

import { useEffect, useState } from 'react';
import { Mic, MonitorUp, Video as VideoIcon } from 'lucide-react';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';

type Connection = { token: string; serverUrl: string };

export function MeetingRoom({ roomId }: { roomId: string }) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [error, setError] = useState('');
  const [deviceStatus, setDeviceStatus] = useState<'checking' | 'ready' | 'blocked'>('checking');
  const [deviceMessage, setDeviceMessage] = useState('Checking camera and microphone permissions…');

  useEffect(() => {
    let active = true;
    async function checkDevices() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (active) {
          setDeviceStatus('blocked');
          setDeviceMessage('Camera and microphone are not available in this browser.');
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach((track) => track.stop());
        if (active) {
          setDeviceStatus('ready');
          setDeviceMessage('Camera and microphone are ready. Screen sharing is available from the meeting toolbar.');
        }
      } catch {
        if (active) {
          setDeviceStatus('blocked');
          setDeviceMessage('Camera or microphone access is blocked. Allow both for this site, then reload the room.');
        }
      }
    }
    void checkDevices();
    return () => { active = false; };
  }, []);

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
    <div className="space-y-3">
      <div className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${deviceStatus === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : deviceStatus === 'blocked' ? 'border-red-200 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
        <Mic className="h-4 w-4" /><VideoIcon className="h-4 w-4" /><MonitorUp className="h-4 w-4" />
        <span>{deviceMessage}</span>
      </div>
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
    </div>
  );
}
