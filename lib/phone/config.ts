export const WEEKDAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
] as const;

export type Weekday = (typeof WEEKDAYS)[number][0];
export type BusinessHours = Partial<Record<Weekday, [string, string]>>;

export function normalizeUsPhone(value: FormDataEntryValue | string | null): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export function formatUsPhone(value: string | null | undefined): string {
  const digits = String(value ?? '')
    .replace(/\D/g, '')
    .replace(/^1(?=\d{10}$)/, '');
  if (digits.length !== 10) return value || '—';
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function validTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function businessHoursFromForm(formData: FormData): BusinessHours {
  const result: BusinessHours = {};
  for (const [key] of WEEKDAYS) {
    if (formData.get(`${key}_enabled`) !== 'on') continue;
    const opens = String(formData.get(`${key}_open`) ?? '');
    const closes = String(formData.get(`${key}_close`) ?? '');
    if (!validTime(opens) || !validTime(closes) || opens >= closes) {
      throw new Error(`Enter valid opening and closing times for ${key.toUpperCase()}.`);
    }
    result[key] = [opens, closes];
  }
  return result;
}

export function parseBusinessHours(value: unknown): BusinessHours {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const parsed: BusinessHours = {};
  for (const [key] of WEEKDAYS) {
    const hours = (value as Record<string, unknown>)[key];
    if (
      Array.isArray(hours) &&
      hours.length === 2 &&
      typeof hours[0] === 'string' &&
      typeof hours[1] === 'string' &&
      validTime(hours[0]) &&
      validTime(hours[1]) &&
      hours[0] < hours[1]
    ) {
      parsed[key] = [hours[0], hours[1]];
    }
  }
  return parsed;
}

export function validMenuDigit(value: FormDataEntryValue | null): number | null {
  const digit = Number(value);
  return Number.isInteger(digit) && digit >= 0 && digit <= 9 ? digit : null;
}
