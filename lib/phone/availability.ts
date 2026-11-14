export type RingMode = 'ring' | 'vibrate' | 'silent' | 'do_not_disturb' | 'offline';
export type AvailabilitySource = 'manual' | 'schedule';
export type AvailabilitySchedule = Record<string, [string, string]>;

export type PhoneExtensionAvailability = {
  enabled: boolean;
  presence_status: string;
  ring_mode: RingMode;
  availability_source: AvailabilitySource;
  availability_schedule: AvailabilitySchedule;
  last_presence_at: string | null;
};

const WEEKDAY_KEYS: Record<string, string> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

export const DEFAULT_AVAILABILITY_SCHEDULE: AvailabilitySchedule = {
  mon: ['09:00', '17:00'],
  tue: ['09:00', '17:00'],
  wed: ['09:00', '17:00'],
  thu: ['09:00', '17:00'],
  fri: ['09:00', '17:00'],
};

export function isWithinSchedule(
  schedule: AvailabilitySchedule,
  timeZone: string,
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = WEEKDAY_KEYS[parts.find((part) => part.type === 'weekday')?.value || ''];
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;
  if (!weekday || !hour || !minute) return false;
  const window = schedule?.[weekday];
  if (!Array.isArray(window) || window.length !== 2) return false;
  const current = `${hour}:${minute}`;
  return current >= window[0] && current < window[1];
}

export function isExtensionReachable(
  extension: PhoneExtensionAvailability,
  timeZone: string,
  now = new Date(),
) {
  if (!extension.enabled) return false;
  if (extension.ring_mode === 'offline' || extension.ring_mode === 'do_not_disturb') return false;
  if (extension.presence_status !== 'available') return false;
  if (!extension.last_presence_at) return false;
  const lastSeen = new Date(extension.last_presence_at).getTime();
  if (!Number.isFinite(lastSeen) || now.getTime() - lastSeen > 120_000) return false;
  if (extension.availability_source === 'schedule') {
    return isWithinSchedule(extension.availability_schedule, timeZone, now);
  }
  return true;
}

export function normalizeUsPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}
