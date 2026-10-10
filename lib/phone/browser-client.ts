'use client';

import type { Session } from 'sip.js';

export type PhoneCall = {
  id: string;
  state: string;
  direction: string;
  options?: { callerNumber?: string };
  answer(options?: unknown): Promise<unknown>;
  hangup(): Promise<unknown>;
  muteAudio(): void;
  unmuteAudio(): void;
  hold?(): Promise<unknown>;
  unhold?(): Promise<unknown>;
  playRingtone(): void;
  stopRingtone(): void;
};
type OutboundOptions = {
  destinationNumber: string;
  callerNumber?: string;
  callerName?: string;
  audio: boolean;
  remoteElement: HTMLAudioElement;
};
type Notification = { call: PhoneCall; displayNumber?: string };
export type PhoneClient = {
  on(event: 'ready' | 'offline' | 'error' | 'call', listener: (data?: any) => void): void;
  connect(): Promise<unknown>;
  disconnect(): Promise<unknown>;
  newCall(options: OutboundOptions): Promise<PhoneCall>;
};
export type PhoneCredential =
  | { provider?: 'telnyx'; token: string }
  | {
      provider: 'asterisk';
      sipUsername: string;
      sipPassword: string;
      sipDomain: string;
      wsUrl: string;
      iceServers: RTCIceServer[];
    };

export function phoneDestination(value: string, provider: string): string | null {
  const trimmed = value.trim();
  // PSTN remains on the working carrier until the PBX trunk has its own live
  // acceptance evidence. A pilot registration does not authorize that cutover.
  if (provider === 'asterisk') return /^(?:0|[1-9]\d{2})$/.test(trimmed) ? trimmed : null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function ringtone() {
  let context: AudioContext | undefined;
  let interval: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    if (interval) clearInterval(interval);
    interval = undefined;
    void context?.close().catch(() => undefined);
    context = undefined;
  };
  return {
    stop,
    play() {
      stop();
      context = new AudioContext();
      const ring = () => {
        if (!context || context.state !== 'running') return;
        const gain = context.createGain();
        gain.gain.value = 0.08;
        gain.connect(context.destination);
        for (const frequency of [440, 480]) {
          const oscillator = context.createOscillator();
          oscillator.frequency.value = frequency;
          oscillator.connect(gain);
          oscillator.start();
          oscillator.stop(context.currentTime + 1.5);
        }
      };
      void context
        .resume()
        .then(ring)
        .catch(() => undefined);
      interval = setInterval(ring, 3500);
    },
  };
}

export async function createPhoneClient(
  credential: PhoneCredential,
  remoteAudio: HTMLAudioElement,
): Promise<PhoneClient> {
  if (credential.provider !== 'asterisk') {
    const { TelnyxRTC } = await import('@telnyx/webrtc');
    const client = new TelnyxRTC({
      login_token: credential.token,
      keepConnectionAliveOnSocketClose: true,
      hangupOnBeforeUnload: false,
    });
    return {
      on(event, listener) {
        const names = {
          ready: 'telnyx.ready',
          error: 'telnyx.error',
          call: 'telnyx.notification',
          offline: 'telnyx.socket.close',
        };
        client.on(names[event] as any, listener);
      },
      connect: () => client.connect(),
      disconnect: () => client.disconnect(),
      newCall: async (options) => client.newCall(options) as unknown as PhoneCall,
    };
  }

  const { SessionManager } = await import('sip.js/lib/platform/web');
  const listeners = new Map<string, Array<(data?: any) => void>>();
  const emit = (event: string, data?: any) =>
    listeners.get(event)?.forEach((listener) => listener(data));
  const calls = new Map<string, PhoneCall>();
  const tone = ringtone();
  let registered = false;
  let completeRegistration: (() => void) | undefined;
  let failRegistration: ((error: Error) => void) | undefined;

  const wrap = (session: Session, state: string, direction = 'outbound'): PhoneCall => {
    let call = calls.get(session.id);
    if (!call) {
      call = {
        id: session.id,
        state,
        direction,
        options: { callerNumber: session.remoteIdentity.uri.user },
        answer: async () => {
          tone.stop();
          await manager.answer(session);
        },
        hangup: async () => {
          tone.stop();
          await manager.hangup(session);
        },
        muteAudio: () => manager.mute(session),
        unmuteAudio: () => manager.unmute(session),
        hold: () => manager.hold(session),
        unhold: () => manager.unhold(session),
        playRingtone: () => tone.play(),
        stopRingtone: () => tone.stop(),
      };
      calls.set(session.id, call);
    }
    call.state = state;
    return call;
  };
  const callEvent = (session: Session, state: string, direction?: string) => {
    const call = wrap(session, state, direction);
    emit('call', { call, displayNumber: call.options?.callerNumber } satisfies Notification);
    if (state === 'hangup') calls.delete(session.id);
  };
  const markOffline = () => {
    registered = false;
    emit('offline');
  };
  const manager = new SessionManager(credential.wsUrl, {
    aor: `sip:${credential.sipUsername}@${credential.sipDomain}`,
    autoStop: true,
    maxSimultaneousSessions: 1,
    media: { constraints: { audio: true, video: false }, remote: { audio: remoteAudio } },
    reconnectionAttempts: 5,
    reconnectionDelay: 4,
    registrationRetry: true,
    registrationRetryInterval: 5,
    registererOptions: { expires: 120 },
    optionsPingInterval: 45,
    userAgentOptions: {
      authorizationUsername: credential.sipUsername,
      authorizationPassword: credential.sipPassword,
      logBuiltinEnabled: false,
      logConfiguration: false,
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionConfiguration: { iceServers: credential.iceServers },
      },
    },
    delegate: {
      onRegistered: () => {
        registered = true;
        completeRegistration?.();
        emit('ready');
      },
      onUnregistered: markOffline,
      onServerDisconnect: () => {
        markOffline();
        failRegistration?.(new Error('The SIP connection was interrupted.'));
      },
      onCallReceived: (session) => callEvent(session, 'ringing', 'inbound'),
      onCallAnswered: (session) => {
        tone.stop();
        callEvent(session, 'active');
      },
      onCallHangup: (session) => {
        tone.stop();
        callEvent(session, 'hangup');
      },
    },
  });
  return {
    on(event, listener) {
      listeners.set(event, [...(listeners.get(event) || []), listener]);
    },
    async connect() {
      // register() resolves when REGISTER is sent; only onRegistered proves a
      // successful SIP response. Opening the WebSocket never means online.
      const confirmed = new Promise<void>((resolve, reject) => {
        completeRegistration = resolve;
        failRegistration = reject;
      });
      const timeout = setTimeout(
        () => failRegistration?.(new Error('SIP registration timed out.')),
        30_000,
      );
      try {
        await Promise.all([
          confirmed,
          (async () => {
            await manager.connect();
            await manager.register();
          })(),
        ]);
      } catch (error) {
        markOffline();
        await manager.disconnect().catch(() => undefined);
        throw error;
      } finally {
        clearTimeout(timeout);
        completeRegistration = undefined;
        failRegistration = undefined;
      }
    },
    async disconnect() {
      tone.stop();
      markOffline();
      try {
        await manager.unregister();
      } finally {
        await manager.disconnect();
      }
    },
    async newCall(options) {
      if (!registered) throw new Error('Connect the phone before calling.');
      const destination = phoneDestination(options.destinationNumber, 'asterisk');
      if (!destination) throw new Error('Enter operator 0 or a three-digit extension.');
      const session = await manager.call(`sip:${destination}@${credential.sipDomain}`);
      return wrap(session, 'calling');
    },
  };
}
