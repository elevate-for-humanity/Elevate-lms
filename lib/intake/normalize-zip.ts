const DEFAULT_INDIANA_ZIP = '46204';

export function normalizeZipValue(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;

  const digits = value.replace(/\D/g, '');
  if (digits.length >= 5) {
    return digits.slice(0, 5);
  }

  return undefined;
}

export function resolveZip(
  values: Array<string | null | undefined>,
  fallback: string = DEFAULT_INDIANA_ZIP,
): string {
  for (const value of values) {
    const normalized = normalizeZipValue(value);
    if (normalized) return normalized;
  }

  return fallback;
}


