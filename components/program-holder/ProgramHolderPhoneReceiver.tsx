'use client';

import { DashboardVideoCalls } from '@/components/communications/DashboardVideoCalls';

import {
  createPhoneClient,
  type PhoneCall as BrowserPhoneCall,
  type PhoneClient,
} from '@/lib/phone/browser-client';
import { installAudioUnlock } from '@/lib/notifications/audio-unlock';
import { claimPhoneContext } from '@/lib/phone/context-lock';
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

export function ProgramHolderPhoneReceiver({ phoneHref = '/program-holder/phone', includeVideoCalls = true }: { phoneHref?: string; includeVideoCalls?: boolean } = {}) {
  const pathname = usePathname();
  const phonePage = /\/(login|signup|reset-password|auth)(\/|$)/.test(pathname) || ['/program-holder/phone', '/host-shop/dashboard/phone', '/communications/phone', '/phone/dial-pad'].includes(pathname);
  const [online, setOnline] = useState(false);
  const [number, setNumber] = useState('');
  const [state, setState] = useState<'idle' | 'ringing' | 'active'>('idle');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const clientRef = useRef<PhoneClient | null>(null);
  const callRef = useRef<BrowserPhoneCall | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // The ringtone's AudioContext stays suspended until the document has had a
  // user gesture, and the receiver auto-connects without one. Prime audio on
  // the first interaction — the same unlock the phone page installs — so a
  // first incoming call can actually sound.
  useEffect(() => installAudioUnlock(), []);

  useEffect(() => {
    if (phonePage) return;
    let active = true;
    const controller = new AbortController();
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let starting = false;
    let reconnecting = false;
    let client: PhoneClient | null = null;
    let ready = false;
    let healConsumed = false;
    let healFailures = 0;
    let isLeader = false;
    // Separate the receiver lease from the full phone page: delayed cleanup
    // during navigation must never disconnect the newly opened dial pad.
    const id = `${currentDeviceId()}_receiver`;
    // The same one-context rule as the dial pad, for this receiver
    // identity: a second live context defers instead of evicting the first
    // one's registration, and takes over if the leader goes away.
    const claim = claimPhoneContext(id);
    claim.onTakeover(() => {
      isLeader = true;
      if (active && !ready && !starting && !reconnecting) {
        void start().catch(() => scheduleReconnect());
      }
    });

    async function ping() {
      if (!ready) return;
      const response = await fetch('/api/program-holder/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          deviceId: id,
          inCall: Boolean(callRef.current),
        }),
      }).catch(() => undefined);
      const ok = Boolean(response?.ok);
      if (active && ready) setOnline(ok);
      if (ok) {
        healConsumed = false;
        healFailures = 0;
        return;
      }
      // A failed heartbeat used to be display-only: once the server-side
      // evidence flipped (frozen page, expired contact or lease) the
      // receiver stayed dead until reload. Recover instead — at most once
      // per registration, with a bounded backoff, so a dead server cannot
      // spin a reconnect loop. A device_not_provisioned reply means the
      // lease is gone and only a full re-provision can bring the device
      // back; recover() re-runs start(), including the token request.
      if (!active || !ready || callRef.current) return;
      const failureBody = response ? await response.json().catch(() => ({})) : {};
      if (!active || !ready || callRef.current) return;
      const leaseGone =
        (failureBody as { code?: string } | null)?.code === 'device_not_provisioned';
      if (leaseGone || !healConsumed) {
        healConsumed = true;
        healFailures += 1;
        scheduleReconnect(
          leaseGone ? 1_000 : Math.min(5_000 * 3 ** (healFailures - 1), 30_000),
        );
      }
    }

    async function start() {
      if (!active || starting || ready || reconnecting) return;
      starting = true;
      try {
      const settingsResponse = await fetch('/api/program-holder/phone', { cache: 'no-store', signal: controller.signal });
      if (!active) return;
      if (settingsResponse.status >= 500) throw new Error('phone_settings_unavailable');
      if (!settingsResponse.ok) {
        if (settingsResponse.status === 429) scheduleReconnect();
        return;
      }
      const settings = await settingsResponse.json();
      if (settings.readOnly) return;
      const ringMode = String(settings?.extension?.ringMode || 'offline');
      if (['offline', 'do_not_disturb'].includes(ringMode)) return;
      const tokenResponse = await fetch('/api/program-holder/phone/token', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: id }),
      });
      if (!active) return;
      if (!tokenResponse.ok) throw new Error('phone_enrollment_unavailable');
      const token = await tokenResponse.json();
      if (!audioRef.current) throw new Error('phone_audio_unavailable');
      client = await createPhoneClient(token, audioRef.current, { signal: controller.signal });
      if (!active) { await client.disconnect(); return; }
      clientRef.current = client;
      client.on('ready', () => {
        if (active) {
          ready = true;
          healConsumed = false;
          void ping();
        }
      });
      client.on('offline', () => {
        ready = false;
        if (active) { setOnline(false); scheduleReconnect(); }
      });
      client.on('error', () => {
        ready = false;
        if (active) { setOnline(false); scheduleReconnect(); }
      });
      client.on('call', (notification: any) => {
        const call = notification?.call as BrowserPhoneCall | undefined;
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
          if (!ready) scheduleReconnect();
        }
      });
      await client.connect();
      if (!active) { await client.disconnect(); return; }
      heartbeat = setInterval(() => void ping(), 45_000);
      } finally { starting = false; }
    }

    function scheduleReconnect(delayMs = 30_000) {
      if (!active || retry || callRef.current) return;
      retry = setTimeout(() => {
        retry = null;
        void recover();
      }, delayMs);
    }

    async function recover() {
      if (reconnecting) return;
      reconnecting = true;
      if (!active) { reconnecting = false; return; }
      ready = false;
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
      client = null;
      clientRef.current = null;
      if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
      reconnecting = false;
      if (active) void start().catch(() => scheduleReconnect());
    }
    // A page that was frozen or backgrounded may never see a SIP event for
    // the registration it lost. Re-check on return to the foreground and
    // on network recovery, mirroring the dial pad's visibility heal:
    // verify with a heartbeat when we believe we are registered, and
    // reconnect when we know we are not.
    const healFromLifecycle = () => {
      if (!active || !isLeader) return;
      if (ready) {
        void ping();
        return;
      }
      if (retry) {
        clearTimeout(retry);
        retry = null;
      }
      if (!starting && !reconnecting) void start().catch(() => scheduleReconnect());
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') healFromLifecycle();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', healFromLifecycle);
    // Only the leading context connects; a follower stays quiet until it
    // takes over (see the claim above).
    void claim.acquired.then((leader) => {
      isLeader = leader;
      if (active && leader) void start().catch(recover);
    });
    return () => {
      active = false;
      ready = false;
      controller.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', healFromLifecycle);
      claim.release();
      if (heartbeat) clearInterval(heartbeat);
      if (retry) clearTimeout(retry);
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
  }, [phonePage, phoneHref]);

  async function answer() {
    const call = callRef.current;
    if (!call) return;
    call.stopRingtone();
    navigator.vibrate?.(0);
    try {
      await call.answer({ audio: true, remoteElement: audioRef.current || undefined });
      setError('');
    } catch {
      setError('Allow microphone access, then answer again.');
    }
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
      {includeVideoCalls ? <DashboardVideoCalls /> : null}
      <audio ref={audioRef} autoPlay playsInline />
      {online && state === 'idle' ? (
        <Link
          href={phoneHref}
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
            {state === 'ringing' ? 'Elevate for Humanity — incoming call' : 'Call connected'}
          </p>
          <h2 className="mt-2 text-3xl font-black">{friendlyNumber(number)}</h2>
          {error && (
            <p role="alert" className="mt-3 text-sm text-amber-200">
              {error}
            </p>
          )}
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
