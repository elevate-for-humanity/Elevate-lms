export const ALERT_SOUNDS = ['chime', 'bell', 'soft', 'voice', 'silent'] as const;
export type AlertSound = (typeof ALERT_SOUNDS)[number];
export type PwaAlertSettings = {
  enabled: boolean;
  email_alerts: boolean;
  student_sign_in: boolean;
  student_sign_out: boolean;
  student_inactive: boolean;
  inactive_days: number;
  sound: AlertSound;
  volume: number;
};
export const DEFAULT_PWA_ALERTS: PwaAlertSettings = {
  enabled: false,
  email_alerts: true,
  student_sign_in: false,
  student_sign_out: false,
  student_inactive: false,
  inactive_days: 14,
  sound: 'chime',
  volume: 0.5,
};
export function normalizeAlertSettings(input: any): PwaAlertSettings {
  const result = { ...DEFAULT_PWA_ALERTS };
  for (const key of [
    'enabled',
    'email_alerts',
    'student_sign_in',
    'student_sign_out',
    'student_inactive',
  ] as const)
    if (typeof input?.[key] === 'boolean') result[key] = input[key];
  if (ALERT_SOUNDS.includes(input?.sound)) result.sound = input.sound;
  if (Number.isFinite(input?.volume)) result.volume = Math.max(0, Math.min(1, input.volume));
  if (Number.isInteger(input?.inactive_days))
    result.inactive_days = Math.max(14, Math.min(90, input.inactive_days));
  return result;
}
export function alertKind(
  notification: any,
): 'email' | 'sign_in' | 'sign_out' | 'inactive' | 'call' | 'missed_call' | 'voicemail' | null {
  const kind = notification.metadata?.alert_kind;
  if (['sign_in', 'sign_out', 'inactive', 'call', 'missed_call', 'voicemail'].includes(kind))
    return kind;
  return String(notification.idempotency_key ?? '').startsWith('email:') ||
    notification.title === 'New interoffice email'
    ? 'email'
    : null;
}
export const ALERT_PHRASES = {
  email: 'You have a message from Elevate for Humanity.',
  sign_in: 'Elevate, a student sign-in was recorded.',
  sign_out: 'Elevate, a student sign-out was recorded.',
  inactive: 'Elevate, a student needs an activity check.',
  call: 'Elevate, you have an incoming call.',
  missed_call: 'Elevate, you missed a call.',
  voicemail: 'Elevate, you have a new voicemail.',
};

/** Sender and subject previews are explicitly requested; never include message bodies. */
export function alertPresentation(notification: any, kind: keyof typeof ALERT_PHRASES) {
  const clean = (value: unknown, max: number) =>
    String(value ?? '')
      .replace(/[\u202a-\u202e\u2066-\u2069]/g, ' ')
      .split('')
      .map((char) => (char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? ' ' : char))
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  if (kind !== 'email') return { title: 'PARIS · Elevate', body: ALERT_PHRASES[kind] };
  const meta = notification?.metadata ?? {};
  const status = meta.email_status;
  const who = clean(status ? meta.recipient : meta.sender_name || meta.sender_email, 100);
  const subject = clean(meta.subject, 180);
  const mailbox = clean(meta.mailbox_address, 100);
  // Only the already-authorized mailbox member receives this short preview.
  // The push opens the exact secured conversation for the complete message.
  const preview = clean(meta.preview, 180);
  const title =
    status === 'sent'
      ? `PARIS replied${who ? ' to ' + who : ''}`
      : status === 'failed'
        ? `PARIS reply failed${who ? ' to ' + who : ''}`
        : `New email${who ? ' from ' + who : ''}`;
  return {
    title,
    body:
      [subject, preview || mailbox].filter(Boolean).join(' · ') ||
      clean(notification?.message, 300) ||
      ALERT_PHRASES.email,
  };
}

export function isPushEndpoint(endpoint: unknown): boolean {
  try {
    const url = new URL(String(endpoint));
    return (
      url.protocol === 'https:' &&
      !url.port &&
      !url.username &&
      !url.password &&
      String(endpoint).length <= 4096 &&
      /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|(?:[a-z0-9-]+\.)*push\.apple\.com|(?:[a-z0-9-]+\.)+notify\.windows\.com)$/.test(
        url.hostname,
      )
    );
  } catch {
    return false;
  }
}

/** Keep email identity when switching between Admin and LMS origins. */
export function emailAlertUrl(notification: any, admin: boolean): string {
  const base = admin ? 'https://admin.elevateforhumanity.org/phone/email'
    : 'https://app.elevateforhumanity.org/communications/email';
  const url = new URL(base);
  let original: URL | null = null;
  try {
    const candidate = new URL(notification.action_url);
    if (['https://app.elevateforhumanity.org', 'https://admin.elevateforhumanity.org'].includes(candidate.origin)
      && ['/communications/email', '/phone/email'].includes(candidate.pathname)) original = candidate;
  } catch { /* Legacy notifications may have no URL. */ }
  for (const [key, field] of [['mailboxId', 'mailbox_id'], ['threadId', 'thread_id']] as const) {
    const value = notification.metadata?.[field] || original?.searchParams.get(key);
    if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) url.searchParams.set(key, value);
  }
  return url.toString();
}
