'use client';

import type { Call, TelnyxRTC as TelnyxRTCType } from '@telnyx/webrtc';
import { Mic, MicOff, Phone, PhoneCall, PhoneOff } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function currentDeviceId() {
  const key = 'elevate-program-holder-phone-device';
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = window.crypto.randomUUID().replaceAll('-', '');
    window.localStorage.setItem(key, id);
  }
  return id;
}

function friendlyNumber(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  return digits.length === 10
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    : value || 'Unknown caller';
}

export function ProgramHolderPhoneReceiver() {
  const phonePage = usePathname() === '/program-holder/phone';
  const [online, setOnline] = useState(false);
  const [number, setNumber] = useState('');
  const [state, setState] = useState<'idle' | 'ringing' | 'active'>('idle');
  const [muted, setMuted] = useState(false);
  const clientRef = useRef<TelnyxRTCType | null>(null);
  const callRef = useRef<Call | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (phonePage) return;
    let active = true;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let client: TelnyxRTCType | null = null;
    const id = currentDeviceId();

    async function ping() {
      await fetch('/api/program-holder/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat', deviceId: id }),
      }).catch(() => undefined);
    }

    async function start() {
      const settingsResponse = await fetch('/api/program-holder/phone', { cache: 'no-store' });
      if (!settingsResponse.ok || !active) return;
      const settings = await settingsResponse.json();
      const ringMode = String(settings?.extension?.ringMode || 'offline');
      if (['offline', 'do_not_disturb'].includes(ringMode)) return;
      const tokenResponse = await fetch('/api/program-holder/phone/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: id }),
      });
      if (!tokenResponse.ok || !active) return;
      const token = await tokenResponse.json();
      const { TelnyxRTC } = await import('@telnyx/webrtc');
      client = new TelnyxRTC({
        login_token: token.token,
        keepConnectionAliveOnSocketClose: true,
        hangupOnBeforeUnload: false,
      });
      clientRef.current = client;
      client.on('telnyx.ready', () => {
        if (active) setOnline(true);
      });
      client.on('telnyx.error', () => {
        if (active) setOnline(false);
      });
      client.on('telnyx.notification', (notification: any) => {
        const call = notification?.call as Call | undefined;
        if (!call || !active) return;
        const callState = String(call.state || '');
        if (callState === 'ringing' && String(call.direction) === 'inbound') {
          callRef.current = call;
          setNumber(
            notification.displayNumber || (call as any).options?.callerNumber || 'Unknown caller',
          );
          setState('ringing');
          if (ringMode === 'ring') {
            try {
              call.playRingtone();
            } catch {
              // The full-screen incoming-call control remains available.
            }
          }
          if (ringMode === 'vibrate') navigator.vibrate?.([350, 150, 350, 150, 700]);
        } else if (callState === 'active') {
          callRef.current = call;
          setState('active');
          setMuted(false);
          navigator.vibrate?.(0);
        } else if (['hangup', 'destroy', 'purge'].includes(callState)) {
          callRef.current = null;
          setState('idle');
          setNumber('');
          setMuted(false);
          navigator.vibrate?.(0);
        }
      });
      await client.connect();
      await ping();
      heartbeat = setInterval(() => void ping(), 45_000);
    }

    void start().catch(async () => {
      if (!active) return;
      setOnline(false);
      try {
        await client?.disconnect();
      } catch {
        // Presence is still cleared below if the socket never fully opened.
      }
      await fetch('/api/program-holder/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', deviceId: id }),
        keepalive: true,
      }).catch(() => undefined);
    });
    return () => {
      active = false;
      if (heartbeat) clearInterval(heartbeat);
      void client?.disconnect();
      clientRef.current = null;
      callRef.current = null;
      setOnline(false);
      setState('idle');
      void fetch('/api/program-holder/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', deviceId: id }),
        keepalive: true,
      }).catch(() => undefined);
    };
  }, [phonePage]);

  async function answer() {
    const call = callRef.current;
    if (!call) return;
    call.stopRingtone();
    navigator.vibrate?.(0);
    await call.answer({ audio: true, remoteElement: audioRef.current || undefined } as any);
  }

  async function hangup() {
    const call = callRef.current;
    if (!call) return;
    call.stopRingtone();
    navigator.vibrate?.(0);
    await call.hangup();
    callRef.current = null;
    setState('idle');
  }

  function toggleMute() {
    const call = callRef.current;
    if (!call) return;
    if (muted) call.unmuteAudio();
    else call.muteAudio();
    setMuted((value) => !value);
  }

  if (phonePage) return null;
  return (
    <>
      <audio ref={audioRef} autoPlay playsInline />
      {online && state === 'idle' ? (
        <Link
          href="/program-holder/phone"
          className="fixed bottom-4 left-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-300 bg-emerald-950 px-4 py-2 text-sm font-black text-white shadow-xl"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          Work phone online
        </Link>
      ) : null}
      {state !== 'idle' ? (
        <section className="fixed inset-x-3 bottom-4 z-[90] mx-auto max-w-xl rounded-3xl border-2 border-cyan-300 bg-slate-950 p-6 text-center text-white shadow-2xl sm:bottom-8">
          <PhoneCall className="mx-auto h-10 w-10 text-cyan-300" />
          <p className="mt-3 text-xs font-black uppercase tracking-widest text-cyan-300">
            {state === 'ringing' ? 'Incoming Elevate call' : 'Call connected'}
          </p>
          <h2 className="mt-2 text-3xl font-black">{friendlyNumber(number)}</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {state === 'ringing' ? (
              <button
                onClick={answer}
                className="min-h-12 rounded-full bg-emerald-600 px-7 font-black"
              >
                <Phone className="mr-2 inline h-5 w-5" /> Answer
              </button>
            ) : (
              <button
                onClick={toggleMute}
                className="min-h-12 rounded-full bg-slate-700 px-6 font-black"
              >
                {muted ? (
                  <MicOff className="mr-2 inline h-5 w-5" />
                ) : (
                  <Mic className="mr-2 inline h-5 w-5" />
                )}
                {muted ? 'Unmute' : 'Mute'}
              </button>
            )}
            <button onClick={hangup} className="min-h-12 rounded-full bg-red-600 px-7 font-black">
              <PhoneOff className="mr-2 inline h-5 w-5" />
              {state === 'ringing' ? 'Decline' : 'Hang up'}
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
