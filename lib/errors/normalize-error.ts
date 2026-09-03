export type ErrorContext = Record<string, unknown>;

export function normalizeError(
  value: unknown,
  fallbackMessage = 'Unknown error'
): Error {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string') {
    return new Error(value);
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    const normalized = new Error(value.message);

    if (
      'name' in value &&
      typeof value.name === 'string' &&
      value.name.trim()
    ) {
      normalized.name = value.name;
    }

    return normalized;
  }

  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(fallbackMessage);
  }
}

export function getErrorContext(value: unknown): ErrorContext {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const context: ErrorContext = {};

  for (const [key, entry] of Object.entries(value)) {
    if (key === 'message' || key === 'name' || key === 'stack') {
      continue;
    }
    context[key] = entry;
  }

  return context;
}
