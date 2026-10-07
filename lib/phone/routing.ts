export type ElevateCallRoute =
  | { kind: 'internal'; extension: string }
  | { kind: 'pstn'; e164: string };

const EXTENSION = /^\d{1,4}$/;
const E164 = /^\+[1-9]\d{7,14}$/;

export function resolveElevateCallRoute(destination: string): ElevateCallRoute | null {
  const value = destination.trim();
  if (EXTENSION.test(value)) return { kind: 'internal', extension: value };
  const digits = value.replace(/[^\d+]/g, '');
  if (E164.test(digits)) return { kind: 'pstn', e164: digits };
  const us = value.replace(/\D/g, '');
  if (us.length === 10) return { kind: 'pstn', e164: `+1${us}` };
  if (us.length === 11 && us.startsWith('1')) return { kind: 'pstn', e164: `+${us}` };
  return null;
}

export function usesCarrier(route: ElevateCallRoute) {
  return route.kind === 'pstn';
}
