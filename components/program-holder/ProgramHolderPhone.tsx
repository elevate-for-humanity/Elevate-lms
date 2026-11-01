'use client';

import { DashboardVideoCalls } from '@/components/communications/DashboardVideoCalls';
import { AudioOutputControl } from '@/components/communications/AudioOutputControl';
import { TranscriptPanel } from '@/components/communications/TranscriptPanel';

import {
  createPhoneClient,
  phoneDestination,
  type PhoneCall as BrowserPhoneCall,
  type PhoneClient,
} from '@/lib/phone/browser-client';
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
import { PhoneRecordingPlayer } from '@/components/communications/PhoneRecordingPlayer';
import { ProgramHolderPhoneIntroduction } from '@/components/program-holder/ProgramHolderPhoneIntroduction';
import { phonePresenceDisplay } from '@/lib/phone/presence-display';

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
  readOnly: boolean;
  phoneNumber: string;
  system: { name: string; timezone: string; status: string };
  notifications: { emailMissedCalls: boolean; smsMissedCalls: boolean; smsPhone: string };
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
    externalFallbackEnabled: boolean;
    externalFallbackAllowed?: boolean;
    externalFallbackNumber: string;
    presenceStatus: string;
    provider: 'asterisk';
  };
  inbox: InboxItem[];
  voicemail?: {
    items: Array<{
      id: string;
      phone_number: string | null;
      transcription: string | null;
      summary: string | null;
      created_at: string;
      recordingUrl: string | null;
    }>;
  };
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

export function ProgramHolderPhone({
  apiBase = '/api/program-holder/phone',
  roleLabel = 'Program Holder',
  calendarHref = '/lms/calendar',
  emailHref = '/communications/email',
}: { apiBase?: string; roleLabel?: string; calendarHref?: string; emailHref?: string } = {}) {
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
  const [held, setHeld] = useState(false);
  const [returnNumber, setReturnNumber] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const clientRef = useRef<PhoneClient | null>(null);
  const outboundClientRef = useRef<PhoneClient | null>(null);
  const callRef = useRef<BrowserPhoneCall | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionAbortRef = useRef<AbortController | null>(null);
  const registrationEpochRef = useRef(0);
  const registeredRef = useRef(false);
  const ringModeRef = useRef<RingMode>('ring');
  const autoConnectAttemptedRef = useRef(false);

  useEffect(() => {
    if (data) ringModeRef.current = data.extension.ringMode;
  }, [data]);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(apiBase, { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error || 'The phone could not be loaded.');
    else {
      setData(result);
      setError('');
    }
    setLoading(false);
  }, [apiBase]);

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
    const controller = connectionAbortRef.current;
    const epoch = registrationEpochRef.current;
    if (!controller || controller.signal.aborted || !registeredRef.current) return;
    const response = await fetch(apiBase, {
      signal: controller.signal,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'heartbeat',
        deviceId: deviceId(),
        inCall: Boolean(callRef.current),
      }),
    }).catch(() => undefined);
    if (
      controller.signal.aborted ||
      epoch !== registrationEpochRef.current ||
      !registeredRef.current
    )
      return;
    if (!response?.ok) {
      setConnected(false);
      setMessage('');
      setError(
        'Registration reachability is not yet verified. The phone will check again automatically.',
      );
    } else {
      setConnected(true);
      setError('');
      setMessage('Phone registration and reachability verified.');
    }
  }, [apiBase]);

  const disconnect = useCallback(async () => {
    connectionAbortRef.current?.abort();
    registrationEpochRef.current += 1;
    registeredRef.current = false;
    setConnected(false);
    setConnecting(false);
    setError('');
    setMessage('Phone disconnected.');
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
    try {
      await clientRef.current?.disconnect();
    } catch {
      // The presence timeout is the fallback when a socket has already closed.
    }
    const response = await fetch(apiBase, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect', deviceId: deviceId() }),
      keepalive: true,
    }).catch(() => undefined);
    if (!response?.ok)
      setError('Phone disconnected locally. Server presence could not yet be confirmed.');
    clientRef.current = null;
    callRef.current = null;
    setConnected(false);
    setCallState('idle');
  }, [apiBase]);

  useEffect(() => {
    return () => {
      connectionAbortRef.current?.abort();
      registrationEpochRef.current += 1;
      registeredRef.current = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      void clientRef.current?.disconnect();
      void outboundClientRef.current?.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    if (connected || connecting || !data || data.readOnly) return;
    setConnecting(true);
    setError('');
    connectionAbortRef.current?.abort();
    const controller = new AbortController();
    connectionAbortRef.current = controller;
    const deadline = setTimeout(() => {
      if (controller.signal.aborted) return;
      controller.abort();
      registrationEpochRef.current += 1;
      registeredRef.current = false;
      setConnected(false);
      setConnecting(false);
      setMessage('');
      setError('Phone connection timed out. Reconnect the phone and check microphone access.');
      const expiredClient = clientRef.current;
      clientRef.current = null;
      void expiredClient?.disconnect().catch(() => undefined);
    }, 45_000);
    const clearDeadline = () => clearTimeout(deadline);
    controller.signal.addEventListener('abort', clearDeadline, { once: true });
    try {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      await clientRef.current?.disconnect().catch(() => undefined);
      clientRef.current = null;
      const tokenResponse = await fetch('/api/program-holder/phone/token', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deviceId() }),
      });
      const tokenData = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok) throw new Error(tokenData.error || 'The phone could not connect.');
      if (!remoteAudioRef.current) throw new Error('The call audio player is unavailable.');
      const client = await createPhoneClient(tokenData, remoteAudioRef.current, { signal: controller.signal });
      if (controller.signal.aborted) {
        await client.disconnect();
        return;
      }
      let ready = false;
      client.on('ready', () => {
        if (controller.signal.aborted) return;
        registrationEpochRef.current += 1;
        registeredRef.current = true;
        ready = true;
        setConnecting(false);
        setMessage('Registration established. Verifying reachability…');
        void heartbeat();
      });
      client.on('offline', () => {
        if (controller.signal.aborted) return;
        registrationEpochRef.current += 1;
        registeredRef.current = false;
        ready = false;
        setConnected(false);
        setConnecting(false);
        setMessage('Phone is offline.');
      });
      client.on('error', (event: any) => {
        if (controller.signal.aborted) return;
        registrationEpochRef.current += 1;
        registeredRef.current = false;
        ready = false;
        setConnected(false);
        setConnecting(false);
        setMessage('');
        setError(
          event?.error?.message || event?.message || 'The phone connection reported an error.',
        );
      });
      client.on('call', (notification: any) => {
        if (controller.signal.aborted) return;
        const call = notification?.call as BrowserPhoneCall | undefined;
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
          setHeld(false);
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
      if (controller.signal.aborted) {
        await client.disconnect();
        return;
      }
      heartbeatRef.current = setInterval(() => {
        if (ready) void heartbeat();
      }, 45_000);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setConnecting(false);
      await disconnect();
      setError(cause instanceof Error ? cause.message : 'The phone could not connect.');
    } finally {
      clearDeadline();
      controller.signal.removeEventListener('abort', clearDeadline);
    }
  }, [connected, connecting, data, disconnect, heartbeat]);

  useEffect(() => {
    if (
      !data ||
      data.readOnly ||
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
    if (!data || data.readOnly) return;
    setSaving(true);
    setMessage('');
    const response = await fetch(apiBase, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ringMode: data.extension.ringMode,
        availabilitySource: data.extension.availabilitySource,
        schedule: data.extension.schedule,
        ringSeconds: data.extension.ringSeconds,
        voicemailGreeting: data.extension.voicemailGreeting,
        externalFallbackEnabled: data.extension.externalFallbackEnabled,
        externalFallbackNumber: data.extension.externalFallbackNumber,
        emailMissedCalls: data.notifications.emailMissedCalls,
        smsMissedCalls: data.notifications.smsMissedCalls,
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

  async function applyRingMode(mode: RingMode) {
    if (!data || data.readOnly || saving) return;
    setSaving(true);
    try {
      const response = await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ring_mode', ringMode: mode }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The alert mode could not be saved.');
      ringModeRef.current = mode;
      setData((current) =>
        current ? { ...current, extension: { ...current.extension, ringMode: mode } } : current,
      );
      if (mode !== 'ring') callRef.current?.stopRingtone();
      if (mode !== 'vibrate') navigator.vibrate?.(0);
      if (mode === 'vibrate' && !navigator.vibrate)
        setMessage(
          'Vibrate selected. This browser does not support vibration; incoming calls still appear onscreen.',
        );
      else
        setMessage(
          mode === 'ring'
            ? 'Incoming call sound is on.'
            : mode === 'vibrate'
              ? 'Incoming calls will vibrate.'
              : 'Incoming call sound is muted.',
        );
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The alert mode could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function enableNotifications() {
    if (data?.readOnly) return;
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
    try {
      await call.answer({ audio: true, remoteElement: remoteAudioRef.current || undefined });
    } catch {
      setError('The call could not be answered. Allow microphone access and try again.');
    }
  }

  async function hangup() {
    const call = callRef.current;
    if (!call) return;
    call.stopRingtone();
    navigator.vibrate?.(0);
    await call.hangup();
    await outboundClientRef.current?.disconnect().catch(() => {});
    outboundClientRef.current = null;
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

  async function toggleHold() {
    const call = callRef.current;
    if (!call?.hold || !call.unhold) return;
    try {
      if (held) await call.unhold();
      else await call.hold();
      setHeld(!held);
    } catch {
      setError('The hold request could not be completed.');
    }
  }

  async function pressDialDigit(digit: string) {
    if (callState === 'active' && callRef.current) {
      if (!callRef.current.dtmf) {
        setError('This phone connection cannot send menu choices.');
        return;
      }
      try {
        await callRef.current.dtmf(digit);
        setError('');
      } catch {
        setError('The menu choice could not be sent. Try again.');
      }
      return;
    }
    setReturnNumber((current) => (current + digit).slice(0, 20));
  }

  async function returnCall(number = returnNumber) {
    if (callState !== 'idle' || callRef.current || outboundClientRef.current) {
      setError('Finish the current call before placing another.');
      return;
    }
    if (data?.readOnly || callRef.current) return;
    let destination = phoneDestination(number, data?.extension.provider || 'telnyx');
    if (data?.extension.provider !== 'asterisk' && /^(0|[0-9]{3})$/.test(number.trim())) {
      try {
        const response = await fetch('/api/communications/phone/dial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extension: number.trim() }),
        });
        const target = await response.json();
        if (!response.ok) {
          setError(target.error || 'The extension is unavailable.');
          return;
        }
        if (
          typeof target.destination !== 'string' ||
          !/^sip:[A-Za-z0-9._-]{1,128}@sip[.]telnyx[.]com$/.test(target.destination)
        ) {
          setError('The extension destination could not be verified.');
          return;
        }
        destination = target.destination;
      } catch {
        setError('The extension could not be reached. Try again.');
        return;
      }
    }
    const externalDestination = /^(?:1)?[0-9]{10}$/.test(number.replace(/[^0-9]/g, ''))
      ? phoneDestination(number, 'telnyx')
      : null;
    if (data?.extension.provider === 'asterisk' && externalDestination) {
      if (!remoteAudioRef.current) return;
      try {
        setCallState('calling');
        setIncomingNumber(number);
        setError('');
        const response = await fetch('/api/program-holder/phone/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: `${deviceId()}_outbound`, purpose: 'external' }),
        });
        const token = await response.json();
        if (!response.ok) throw Error(token.error || 'Outbound carrier is unavailable.');
        const client = await createPhoneClient(token, remoteAudioRef.current);
        outboundClientRef.current = client;
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(Error('Outbound phone registration timed out.')),
            25000,
          );
          client.on('ready', () => {
            clearTimeout(timeout);
            resolve();
          });
          client.on('error', () => {
            clearTimeout(timeout);
            reject(Error('Outbound carrier connection failed.'));
          });
          void client.connect().catch(reject);
        });
        client.on('call', (event: any) => {
          const call = event?.call;
          if (!call) return;
          if (call.state === 'active') {
            callRef.current = call;
            setCallState('active');
          }
          if (['hangup', 'destroy', 'purge'].includes(call.state)) {
            callRef.current = null;
            setCallState('idle');
            void client.disconnect();
            outboundClientRef.current = null;
          }
        });
        callRef.current = await client.newCall({
          destinationNumber: externalDestination,
          callerNumber: token.callerId,
          callerName: data.extension.displayName,
          audio: true,
          remoteElement: remoteAudioRef.current,
        });
      } catch (e) {
        setCallState('idle');
        await outboundClientRef.current?.disconnect().catch(() => {});
        outboundClientRef.current = null;
        setError(e instanceof Error ? e.message : 'Outbound call failed.');
      }
      return;
    }
    if (!registeredRef.current) {
      await connect();
      if (!registeredRef.current && clientRef.current) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 15000);
          clientRef.current!.on('ready', () => {
            clearTimeout(timeout);
            resolve();
          });
          clientRef.current!.on('error', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }
      if (!registeredRef.current) {
        setError('The phone could not register. Check the connection and try Return call again.');
        return;
      }
    }
    if (!destination || !clientRef.current || !remoteAudioRef.current) {
      setError(
        !connected
          ? 'Connect the phone before returning a call.'
          : 'Enter a valid phone number or an enabled three-digit extension.',
      );
      return;
    }
    if (callRef.current) return;
    try {
      setIncomingNumber(number);
      setCallState('calling');
      setError('');
      const call = await clientRef.current.newCall({
        destinationNumber: destination,
        callerNumber: data?.phoneNumber,
        callerName: data?.extension.displayName,
        audio: true,
        remoteElement: remoteAudioRef.current,
      });
      callRef.current = call;
    } catch {
      if (!callRef.current) setCallState('idle');
      setError('The call could not be placed. Check microphone permission and try again.');
    }
  }

  async function setTaskStatus(id: string, status: InboxItem['status']) {
    if (data?.readOnly) return;
    const response = await fetch(`${apiBase}/inbox/${id}`, {
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

  const presence = phonePresenceDisplay(data.readOnly, connected, data.extension.presenceStatus);

  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl space-y-6 p-4 sm:p-6">
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <AudioOutputControl audio={remoteAudioRef} />
      <nav aria-label="Phone communication tools" className="flex gap-2 overflow-x-auto">
        <a
          href="/communications/texts"
          className="shrink-0 rounded-lg border bg-white p-3 font-bold text-blue-900"
        >
          Text messages
        </a>
        <a
          href={emailHref}
          className="shrink-0 rounded-lg border bg-white p-3 font-bold text-blue-900"
        >
          Interoffice email
        </a>
        <a
          href={calendarHref}
          className="shrink-0 rounded-lg border bg-white p-3 font-bold text-blue-900"
        >
          Calendar
        </a>
      </nav>
      {data.readOnly && (
        <p className="rounded-2xl border border-blue-200 bg-blue-50 p-4 font-bold text-blue-950">
          Administrator preview: this {roleLabel} extension, settings, and PARIS call inbox are
          shown read-only. Sign in as the {roleLabel} to connect the PWA, change settings, return
          calls, or update callback status.
        </p>
      )}
      <header className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-700 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              Elevate Phone
            </p>
            <h1 className="mt-2 text-3xl font-black">{data.extension.displayName}</h1>
            <p className="mt-2 text-blue-100">
              Extension {data.extension.extension} · {data.extension.department || roleLabel}
            </p>
            <p className="mt-1 text-lg font-bold">
              Business caller ID {friendlyNumber(data.phoneNumber)}
            </p>
          </div>
          <div
            className={`rounded-2xl border px-5 py-4 ${presence.online ? 'border-emerald-300 bg-emerald-500/20' : 'border-white/30 bg-white/10'}`}
          >
            <p className="flex items-center gap-2 font-black">
              <span
                className={`h-3 w-3 rounded-full ${presence.online ? 'bg-emerald-300' : 'bg-slate-300'}`}
              />
              {presence.label}
            </p>
            <button
              onClick={connected ? disconnect : connect}
              disabled={
                data.readOnly ||
                connecting ||
                ['offline', 'do_not_disturb'].includes(data.extension.ringMode)
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

      <section className="mx-auto w-full min-w-0 max-w-[26rem] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-xl font-black text-slate-950">Dial pad</h2>
        <p className="mt-1 text-sm text-slate-600">
          {data.extension.provider === 'asterisk'
            ? 'Enter an extension, 0 for admin, or a phone number for an outbound carrier call.'
            : 'The caller sees the Elevate business number, not your personal number.'}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => void pressDialDigit(digit)}
              className="min-h-12 rounded-xl border border-slate-300 bg-slate-50 text-xl font-black text-slate-950 active:bg-slate-200"
            >
              {digit}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={returnNumber}
            onChange={(event) => setReturnNumber(event.target.value)}
            type="tel"
            aria-label="Phone number or extension"
            inputMode="tel"
            placeholder={'Phone number or extension'}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-3"
          />
          <button
            onClick={() => returnCall()}
            disabled={data.readOnly || connecting || callState !== 'idle'}
            className="min-h-12 rounded-xl bg-emerald-700 px-4 font-black text-white"
          >
            <PhoneCall className="h-5 w-5" />
            <span className="sr-only">Call</span>
          </button>
        </div>
        <DashboardVideoCalls extension={returnNumber} disabled={data.readOnly || callState !== 'idle'} />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setReturnNumber((current) => current.slice(0, -1))}
            className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-bold"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setReturnNumber('')}
            className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-bold"
          >
            Clear
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
        <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Incoming call alert mode">
          {(
            [
              ['ring', 'Ring on'],
              ['vibrate', 'Vibrate'],
              ['silent', 'Ring muted'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              disabled={saving || data.readOnly}
              aria-pressed={data.extension.ringMode === mode}
              onClick={() => void applyRingMode(mode)}
              className={`min-h-12 rounded-xl border px-3 font-bold ${data.extension.ringMode === mode ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-900'} disabled:opacity-50`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {callState !== 'idle' && (
        <section className="mx-auto w-full max-w-md rounded-3xl border-2 border-cyan-300 bg-slate-950 p-5 text-center text-white shadow-2xl">
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
            {callState === 'active' && callRef.current?.hold && (
              <button
                onClick={toggleHold}
                className="min-h-12 rounded-full bg-slate-700 px-6 font-black"
              >
                {held ? 'Resume call' : 'Hold'}
              </button>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <Headphones className="h-5 w-5 text-blue-700" />
            Availability and ringing
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Your extension rings in your Elevate phone. Unanswered calls go to PARIS or voicemail.
          </p>
          {data.extension.externalFallbackAllowed && <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <label className="flex items-center gap-3 text-sm font-bold text-blue-950">
              <input
                type="checkbox"
                checked={data.extension.externalFallbackEnabled}
                onChange={(event) =>
                  updateExtension({ externalFallbackEnabled: event.target.checked })
                }
                disabled={data.readOnly}
                className="h-5 w-5 accent-blue-700"
              />
              Use the approved administrator forwarding destination
            </label>
            {data.extension.externalFallbackEnabled && (
              <label className="mt-3 block text-sm font-bold text-slate-800">
                Administrator forwarding destination
                <input
                  type="tel"
                  inputMode="tel"
                  value={data.extension.externalFallbackNumber}
                  readOnly
                  placeholder="(317) 555-0123"
                  disabled={data.readOnly}
                  className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
                />
              </label>
            )}
            <p className="mt-2 text-xs leading-5 text-slate-600">
              This destination is reserved for the administrator. Other extensions cannot forward to cell phones.
            </p>
          </div>}
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
              disabled={saving || data.readOnly}
              className="min-h-12 rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-50"
            >
              <Save className="mr-2 inline h-5 w-5" />
              {saving ? 'Saving…' : 'Save and apply'}
            </button>
            <button
              onClick={enableNotifications}
              disabled={notificationsEnabled || data.readOnly}
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
          <label className="mt-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-800">
            <input
              type="checkbox"
              checked={data.notifications.smsMissedCalls}
              disabled={!data.notifications.smsPhone}
              onChange={(event) =>
                setData((current) =>
                  current
                    ? {
                        ...current,
                        notifications: {
                          ...current.notifications,
                          smsMissedCalls: event.target.checked,
                        },
                      }
                    : current,
                )
              }
              className="mt-0.5 h-5 w-5 shrink-0 accent-blue-700"
            />
            <span>
              Text me a privacy-safe alert when PARIS takes a call
              {data.notifications.smsPhone
                ? ` at ${friendlyNumber(data.notifications.smsPhone)}`
                : '. Add an SMS phone number in notification settings first'}
              .
            </span>
          </label>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            For the most reliable live ringing, install the PWA and keep it open or recently active.
            If the phone is asleep, offline, outside your hours, or unanswered, PARIS takes the call
            and sends a secure missed-call alert.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black">Voicemail</h2>
        {data.voicemail?.items?.length ? (
          data.voicemail.items.map((item) => (
            <article key={item.id} className="mt-3 rounded-xl border p-4">
              <p className="font-bold">{friendlyNumber(item.phone_number)}</p>
              <p className="text-sm text-slate-600">{formatDate(item.created_at)}</p>
              <TranscriptPanel
                text={item.transcription}
                summary={item.summary}
                transcribeUrl={`/api/communications/transcripts/voicemail/${item.id}`}
              />
              {item.recordingUrl ? (
                <PhoneRecordingPlayer url={item.recordingUrl} />
              ) : (
                <p className="mt-2 text-sm">Audio is not available for this message.</p>
              )}
            </article>
          ))
        ) : (
          <p className="mt-3 text-sm text-slate-600">No voicemail messages.</p>
        )}
      </section>

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
                  disabled={data.readOnly}
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
              <TranscriptPanel
                text={item.transcript}
                summary={item.summary}
                transcribeUrl={`/api/communications/transcripts/callback/${item.id}`}
              />
              {item.recordingUrl && <PhoneRecordingPlayer url={item.recordingUrl} />}
              {item.callback_number && (
                <button
                  disabled={data.readOnly || connecting || callState !== 'idle'}
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
      <ProgramHolderPhoneIntroduction roleLabel={roleLabel} />
    </main>
  );
}
