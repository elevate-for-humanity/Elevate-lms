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
export function alertKind(notification: any): 'email' | 'sign_in' | 'sign_out' | 'inactive' | null {
  const kind = notification.metadata?.alert_kind;
  if (['sign_in', 'sign_out', 'inactive'].includes(kind)) return kind;
  return String(notification.idempotency_key ?? '').startsWith('email:') ||
    notification.title === 'New interoffice email'
    ? 'email'
    : null;
}
export const ALERT_PHRASES = {
  email: 'Elevate, you have a new email.',
  sign_in: 'Elevate, a student sign-in was recorded.',
  sign_out: 'Elevate, a student sign-out was recorded.',
  inactive: 'Elevate, a student needs an activity check.',
};

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
