'use client';

import type { Call, TelnyxRTC as TelnyxRTCType } from '@telnyx/webrtc';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
  Headphones,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Save,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getPushNotificationClient } from '@/lib/notifications/push-client';
import { ProgramHolderPhoneIntroduction } from '@/components/program-holder/ProgramHolderPhoneIntroduction';

type RingMode = 'ring' | 'vibrate' | 'silent' | 'do_not_disturb' | 'offline';
type Schedule = Record<string, [string, string]>;
type InboxItem = {
  id: string;
  source: 'paris' | 'voicemail' | 'missed_call';
  caller_name: string | null;
  callback_number: string | null;
  reason: string | null;
  program_or_department: string | null;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  preferred_callback_time: string | null;
  transcript: string | null;
  summary: string | null;
  status: 'new' | 'acknowledged' | 'contacted' | 'resolved';
  created_at: string;
  hasRecording: boolean;
  recordingUrl: string | null;
};
type PhoneData = {
  phoneNumber: string;
  system: { name: string; timezone: string; status: string };
  notifications: { emailMissedCalls: boolean };
  extension: {
    id: string;
    extension: string;
    displayName: string;
    department: string | null;
    ringMode: RingMode;
    availabilitySource: 'manual' | 'schedule';
    schedule: Schedule;
    ringSeconds: number;
    voicemailGreeting: string;
    presenceStatus: string;
  };
  inbox: InboxItem[];
};

const DAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
] as const;

function deviceId() {
  const key = 'elevate-program-holder-phone-device';
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = window.crypto.randomUUID().replaceAll('-', '');
    window.localStorage.setItem(key, id);
  }
  return id;
}

function friendlyNumber(value?: string | null) {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .replace(/^1(?=\d{10}$)/, '');
  return digits.length === 10
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    : value || 'Unknown caller';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ProgramHolderPhone() {
  const [data, setData] = useState<PhoneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'active' | 'calling'>('idle');
  const [muted, setMuted] = useState(false);
  const [returnNumber, setReturnNumber] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const clientRef = useRef<TelnyxRTCType | null>(null);
  const callRef = useRef<Call | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringModeRef = useRef<RingMode>('ring');
  const autoConnectAttemptedRef = useRef(false);

  useEffect(() => {
    if (data) ringModeRef.current = data.extension.ringMode;
  }, [data]);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/program-holder/phone', { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error || 'The phone could not be loaded.');
    else {
      setData(result);
      setError('');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    if ('serviceWorker' in navigator && 'Notification' in window) {
      void navigator.serviceWorker.ready.then(async (registration) => {
        const push = getPushNotificationClient();
        await push.init(registration);
        const state = await push.getPermissionState();
        setNotificationsEnabled(state.isSubscribed && state.permission === 'granted');
      });
    }
  }, [load]);

  const heartbeat = useCallback(async () => {
    await fetch('/api/program-holder/phone', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'heartbeat', deviceId: deviceId() }),
    }).catch(() => undefined);
  }, []);

  const disconnect = useCallback(async () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
    try {
      await clientRef.current?.disconnect();
    } catch {
      // The presence timeout is the fallback when a socket has already closed.
    }
    await fetch('/api/program-holder/phone', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect', deviceId: deviceId() }),
      keepalive: true,
    }).catch(() => undefined);
    clientRef.current = null;
    callRef.current = null;
    setConnected(false);
    setCallState('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      void clientRef.current?.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    if (connected || connecting || !data) return;
    setConnecting(true);
    setError('');
    try {
      const tokenResponse = await fetch('/api/program-holder/phone/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deviceId() }),
      });
      const tokenData = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok) throw new Error(tokenData.error || 'The phone could not connect.');
      const { TelnyxRTC } = await import('@telnyx/webrtc');
      const client = new TelnyxRTC({
        login_token: tokenData.token,
        keepConnectionAliveOnSocketClose: true,
        hangupOnBeforeUnload: false,
      });
      client.on('telnyx.ready', () => {
        setConnected(true);
        setConnecting(false);
        setMessage('Phone is online and ready for calls.');
      });
      client.on('telnyx.error', (event: any) => {
        setError(
          event?.error?.message || event?.message || 'The phone connection reported an error.',
        );
      });
      client.on('telnyx.notification', (notification: any) => {
        const call = notification?.call as Call | undefined;
        if (!call) return;
        const state = String(call.state || '');
        if (state === 'ringing' && String(call.direction) === 'inbound') {
          callRef.current = call;
          setIncomingNumber(
            notification.displayNumber || (call as any).options?.callerNumber || 'Unknown caller',
          );
          setCallState('ringing');
          if (ringModeRef.current === 'ring') {
            try {
              call.playRingtone();
            } catch {
              // The visible incoming-call screen remains available if autoplay is blocked.
            }
          }
          if (ringModeRef.current === 'vibrate') navigator.vibrate?.([350, 150, 350, 150, 700]);
        } else if (state === 'active') {
          callRef.current = call;
          setCallState('active');
          setMuted(false);
          navigator.vibrate?.(0);
        } else if (state === 'hangup' || state === 'destroy' || state === 'purge') {
          if (callRef.current?.id === call.id) {
            callRef.current = null;
            setCallState('idle');
            setIncomingNumber('');
            setMuted(false);
          }
          navigator.vibrate?.(0);
        }
      });
      clientRef.current = client;
      await client.connect();
      await heartbeat();
      heartbeatRef.current = setInterval(() => void heartbeat(), 45_000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The phone could not connect.');
      setConnecting(false);
      await disconnect();
    }
  }, [connected, connecting, data, disconnect, heartbeat]);

  useEffect(() => {
    if (
      !data ||
      autoConnectAttemptedRef.current ||
      connected ||
      connecting ||
      ['offline', 'do_not_disturb'].includes(data.extension.ringMode)
    ) {
      return;
    }
    autoConnectAttemptedRef.current = true;
    void connect();
  }, [connect, connected, connecting, data]);

  async function saveSettings() {
    if (!data) return;
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/program-holder/phone', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ringMode: data.extension.ringMode,
        availabilitySource: data.extension.availabilitySource,
        schedule: data.extension.schedule,
        ringSeconds: data.extension.ringSeconds,
        voicemailGreeting: data.extension.voicemailGreeting,
        emailMissedCalls: data.notifications.emailMissedCalls,
      }),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(result.error || 'Phone settings could not be saved.');
      return;
    }
    setMessage('Phone settings saved.');
    setError('');
    if (['offline', 'do_not_disturb'].includes(data.extension.ringMode)) await disconnect();
    else if (!connected) await connect();
  }

  async function enableNotifications() {
    setError('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const push = getPushNotificationClient();
      await push.init(registration);
      await push.subscribe();
      setNotificationsEnabled(true);
      setMessage('Missed-call notifications are enabled.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Notifications could not be enabled.');
    }
  }

  async function answer() {
    const call = callRef.current;
    if (!call) return;
    call.stopRingtone();
    navigator.vibrate?.(0);
    await call.answer({ audio: true, remoteElement: remoteAudioRef.current || undefined } as any);
  }

  async function hangup() {
    const call = callRef.current;
    if (!call) return;
    call.stopRingtone();
    navigator.vibrate?.(0);
    await call.hangup();
    callRef.current = null;
    setCallState('idle');
  }

  function toggleMute() {
    const call = callRef.current;
    if (!call) return;
    if (muted) call.unmuteAudio();
    else call.muteAudio();
    setMuted(!muted);
  }

  function returnCall(number = returnNumber) {
    const digits = number.replace(/\D/g, '');
    const destination =
      digits.length === 10
        ? `+1${digits}`
        : digits.length === 11 && digits[0] === '1'
          ? `+${digits}`
          : '';
    if (!destination || !clientRef.current || !remoteAudioRef.current) {
      setError(
        !connected
          ? 'Connect the phone before returning a call.'
          : 'Enter a valid 10-digit number.',
      );
      return;
    }
    const call = clientRef.current.newCall({
      destinationNumber: destination,
      callerNumber: data?.phoneNumber,
      callerName: data?.extension.displayName,
      audio: true,
      remoteElement: remoteAudioRef.current,
    });
    callRef.current = call;
    setIncomingNumber(destination);
    setCallState('calling');
    setError('');
  }

  async function setTaskStatus(id: string, status: InboxItem['status']) {
    const response = await fetch(`/api/program-holder/phone/inbox/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      setData((current) =>
        current
          ? {
              ...current,
              inbox: current.inbox.map((item) => (item.id === id ? { ...item, status } : item)),
            }
          : current,
      );
    }
  }

  if (loading)
    return (
      <main className="mx-auto max-w-6xl p-6">
        <p>Loading your phone…</p>
      </main>
    );
  if (!data)
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 font-bold text-red-900">
          {error || 'No phone extension is assigned.'}
        </div>
      </main>
    );

  const updateExtension = (patch: Partial<PhoneData['extension']>) =>
    setData((current) =>
      current ? { ...current, extension: { ...current.extension, ...patch } } : current,
    );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <ProgramHolderPhoneIntroduction />
      <header className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-700 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              Elevate Phone
            </p>
            <h1 className="mt-2 text-3xl font-black">{data.extension.displayName}</h1>
            <p className="mt-2 text-blue-100">
              Extension {data.extension.extension} · {data.extension.department || 'Program Holder'}
            </p>
            <p className="mt-1 text-lg font-bold">
              Business caller ID {friendlyNumber(data.phoneNumber)}
            </p>
          </div>
          <div
            className={`rounded-2xl border px-5 py-4 ${connected ? 'border-emerald-300 bg-emerald-500/20' : 'border-white/30 bg-white/10'}`}
          >
            <p className="flex items-center gap-2 font-black">
              <span
                className={`h-3 w-3 rounded-full ${connected ? 'bg-emerald-300' : 'bg-slate-300'}`}
              />
              {connected ? 'Online for calls' : 'Phone offline'}
            </p>
            <button
              onClick={connected ? disconnect : connect}
              disabled={
                connecting || ['offline', 'do_not_disturb'].includes(data.extension.ringMode)
              }
              className="mt-3 min-h-11 rounded-xl bg-white px-5 font-black text-blue-900 disabled:opacity-50"
            >
              {connecting ? 'Connecting…' : connected ? 'Disconnect' : 'Connect phone'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-900"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900"
        >
          {message}
        </p>
      )}

      {callState !== 'idle' && (
        <section className="rounded-3xl border-2 border-cyan-300 bg-slate-950 p-7 text-center text-white shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/20">
            <PhoneCall className="h-10 w-10 text-cyan-300" />
          </div>
          <p className="mt-4 text-sm font-black uppercase tracking-widest text-cyan-300">
            {callState === 'ringing'
              ? 'Incoming call'
              : callState === 'calling'
                ? 'Calling'
                : 'Call connected'}
          </p>
          <h2 className="mt-2 text-3xl font-black">{friendlyNumber(incomingNumber)}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {callState === 'ringing' && (
              <button
                onClick={answer}
                className="min-h-12 rounded-full bg-emerald-500 px-7 font-black text-white"
              >
                <Phone className="mr-2 inline h-5 w-5" />
                Answer
              </button>
            )}
            {callState === 'active' && (
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
            <button
              onClick={hangup}
              className="min-h-12 rounded-full bg-red-600 px-7 font-black text-white"
            >
              <PhoneOff className="mr-2 inline h-5 w-5" />
              {callState === 'ringing' ? 'Decline' : 'Hang up'}
            </button>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <Headphones className="h-5 w-5 text-blue-700" />
            Availability and ringing
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Calls ring only in this PWA. They never forward to your personal cell number.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-800">
              Phone mode
              <select
                value={data.extension.ringMode}
                onChange={(event) => updateExtension({ ringMode: event.target.value as RingMode })}
                className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="ring">Ring with sound</option>
                <option value="vibrate">Vibrate only</option>
                <option value="silent">Silent visual call</option>
                <option value="do_not_disturb">Do not disturb</option>
                <option value="offline">Phone off</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-800">
              Availability
              <select
                value={data.extension.availabilitySource}
                onChange={(event) =>
                  updateExtension({
                    availabilitySource: event.target.value as 'manual' | 'schedule',
                  })
                }
                className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="manual">Use phone mode</option>
                <option value="schedule">Use my weekly hours</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-800">
              Ring before PARIS answers
              <select
                value={data.extension.ringSeconds}
                onChange={(event) => updateExtension({ ringSeconds: Number(event.target.value) })}
                className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                {[10, 15, 20, 25, 30, 45, 60].map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds} seconds
                  </option>
                ))}
              </select>
            </label>
          </div>
          {data.extension.availabilitySource === 'schedule' && (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-black text-slate-900">
                <Clock3 className="mr-2 inline h-4 w-4" />
                Weekly hours ({data.system.timezone})
              </p>
              {DAYS.map(([key, label]) => {
                const window = data.extension.schedule[key];
                const enabled = Boolean(window);
                return (
                  <div
                    key={key}
                    className="grid grid-cols-[110px_1fr_1fr] items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm"
                  >
                    <label className="font-bold">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(event) => {
                          const schedule = { ...data.extension.schedule };
                          if (event.target.checked) schedule[key] = ['09:00', '17:00'];
                          else delete schedule[key];
                          updateExtension({ schedule });
                        }}
                        className="mr-2 h-5 w-5 align-middle accent-blue-700"
                      />
                      {label.slice(0, 3)}
                    </label>
                    <input
                      aria-label={`${label} start`}
                      type="time"
                      disabled={!enabled}
                      value={window?.[0] || '09:00'}
                      onChange={(event) =>
                        updateExtension({
                          schedule: {
                            ...data.extension.schedule,
                            [key]: [event.target.value, window?.[1] || '17:00'],
                          },
                        })
                      }
                      className="min-h-10 rounded-lg border px-2 disabled:opacity-40"
                    />
                    <input
                      aria-label={`${label} end`}
                      type="time"
                      disabled={!enabled}
                      value={window?.[1] || '17:00'}
                      onChange={(event) =>
                        updateExtension({
                          schedule: {
                            ...data.extension.schedule,
                            [key]: [window?.[0] || '09:00', event.target.value],
                          },
                        })
                      }
                      className="min-h-10 rounded-lg border px-2 disabled:opacity-40"
                    />
                  </div>
                );
              })}
            </div>
          )}
          <label className="mt-5 block text-sm font-bold text-slate-800">
            Personal unavailable greeting (optional)
            <textarea
              value={data.extension.voicemailGreeting}
              onChange={(event) => updateExtension({ voicemailGreeting: event.target.value })}
              maxLength={600}
              rows={3}
              placeholder="I’m unavailable right now. PARIS can take your name, number, and reason for calling."
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal"
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="min-h-12 rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-50"
            >
              <Save className="mr-2 inline h-5 w-5" />
              {saving ? 'Saving…' : 'Save and apply'}
            </button>
            <button
              onClick={enableNotifications}
              disabled={notificationsEnabled}
              className="min-h-12 rounded-xl border border-blue-300 bg-blue-50 px-5 font-black text-blue-900 disabled:opacity-60"
            >
              {notificationsEnabled ? (
                <CheckCircle2 className="mr-2 inline h-5 w-5" />
              ) : (
                <Bell className="mr-2 inline h-5 w-5" />
              )}
              {notificationsEnabled ? 'Alerts enabled' : 'Enable missed-call alerts'}
            </button>
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-800">
            <input
              type="checkbox"
              checked={data.notifications.emailMissedCalls}
              onChange={(event) =>
                setData((current) =>
                  current
                    ? {
                        ...current,
                        notifications: {
                          ...current.notifications,
                          emailMissedCalls: event.target.checked,
                        },
                      }
                    : current,
                )
              }
              className="mt-0.5 h-5 w-5 shrink-0 accent-blue-700"
            />
            <span>
              Email me a privacy-safe alert when PARIS takes a call. Caller details stay inside the
              secure dashboard.
            </span>
          </label>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            For the most reliable live ringing, install the PWA and keep it open or recently active.
            If the phone is asleep, offline, outside your hours, or unanswered, PARIS takes the call
            and sends a secure missed-call alert.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-slate-950">Return a call</h2>
          <p className="mt-1 text-sm text-slate-600">
            The caller sees the Elevate business number, not your personal number.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              value={returnNumber}
              onChange={(event) => setReturnNumber(event.target.value)}
              type="tel"
              inputMode="tel"
              placeholder="317-555-0123"
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-3"
            />
            <button
              onClick={() => returnCall()}
              className="min-h-12 rounded-xl bg-emerald-700 px-4 font-black text-white"
            >
              <PhoneCall className="h-5 w-5" />
              <span className="sr-only">Call</span>
            </button>
          </div>
          <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 p-4">
            <h3 className="flex items-center gap-2 font-black text-violet-950">
              <BellRing className="h-5 w-5" />
              What happens when you miss a call
            </h3>
            <p className="mt-2 text-sm leading-6 text-violet-900">
              PARIS tells the caller you are unavailable, asks their name, callback number, reason,
              program, urgency, and preferred callback time, then puts the interview in your inbox
              below.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div className="rounded-xl bg-blue-50 p-3">
              <Volume2 className="mx-auto mb-1 h-5 w-5 text-blue-700" />
              Ring
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <Phone className="mx-auto mb-1 h-5 w-5 text-amber-700" />
              Vibrate
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <VolumeX className="mx-auto mb-1 h-5 w-5 text-slate-700" />
              Silent
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-700">
              PARIS call inbox
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Calls to return</h2>
          </div>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-900">
            {data.inbox.filter((item) => item.status !== 'resolved').length} open
          </span>
        </div>
        <div className="mt-5 space-y-4">
          {data.inbox.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-600">
              No missed calls or messages yet.
            </p>
          )}
          {data.inbox.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 ${item.urgency === 'urgent' ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-950">
                      {item.caller_name || friendlyNumber(item.callback_number)}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-black uppercase ${item.urgency === 'urgent' || item.urgency === 'high' ? 'bg-red-200 text-red-900' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {item.urgency}
                    </span>
                    <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-900">
                      {item.source.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(item.created_at)} · {friendlyNumber(item.callback_number)}
                  </p>
                </div>
                <select
                  aria-label="Callback status"
                  value={item.status}
                  onChange={(event) =>
                    void setTaskStatus(item.id, event.target.value as InboxItem['status'])
                  }
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold"
                >
                  <option value="new">New</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="contacted">Contacted</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">
                {item.summary || item.reason || 'Caller requested a callback.'}
              </p>
              {item.program_or_department && (
                <p className="mt-1 text-sm text-slate-700">
                  Program/department: {item.program_or_department}
                </p>
              )}
              {item.preferred_callback_time && (
                <p className="mt-1 text-sm text-slate-700">
                  Preferred time: {item.preferred_callback_time}
                </p>
              )}
              {item.transcript && (
                <details className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <summary className="cursor-pointer font-black">Read transcript</summary>
                  <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">
                    {item.transcript}
                  </p>
                </details>
              )}
              {item.recordingUrl && (
                <audio controls preload="none" src={item.recordingUrl} className="mt-3 w-full" />
              )}
              {item.callback_number && (
                <button
                  onClick={() => {
                    setReturnNumber(item.callback_number || '');
                    returnCall(item.callback_number || '');
                  }}
                  className="mt-3 min-h-11 rounded-xl bg-blue-700 px-4 font-black text-white"
                >
                  <PhoneCall className="mr-2 inline h-4 w-4" />
                  Return call
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
