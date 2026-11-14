const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'api_key',
  'apiKey',
  'apikey',
  'authorization',
  'auth',
  'cookie',
  'session',
  'private_key',
  'privateKey',
  'service_role',
  'serviceRole',
];

export function redactSecrets(obj: Record<string, any>): Record<string, any> {
  const redacted: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      redacted[key] = redactSecrets(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}
