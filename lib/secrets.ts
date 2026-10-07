/**
 * Google delivers only this service's Secret Manager references at startup.
 * Never hydrate the entire Supabase platform_secrets table: doing so bypasses
 * the service account's secret IAM boundary and replaces deployed values.
 * Missing values stay missing so each integration's readiness check fails.
 */
function runtimeSecret(key: string): string | undefined {
  if (/^(NORTHFLANK_|NF_)/.test(key)) return undefined;
  const value = process.env[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/** Compatibility boundary: Google has already injected secrets before startup. */
export async function hydrateProcessEnv(): Promise<void> {
  // Deliberately no remote lookup, process-wide mutation, or secret enumeration.
}

export async function getSecret(key: string): Promise<string | undefined> {
  return runtimeSecret(key);
}

export async function getSecrets<K extends string>(keys: K[]): Promise<Record<K, string | undefined>> {
  const result = {} as Record<K, string | undefined>;
  for (const key of keys) result[key] = runtimeSecret(key);
  return result;
}

export function getCachedSecret(key: string): string | undefined {
  return runtimeSecret(key);
}

/** No application cache: a Google revision must be deployed to rotate env secrets. */
export async function refreshSecrets(): Promise<void> {
  await hydrateProcessEnv();
}

/** Legacy API name; decryption and access authorization now belong to Google. */
export async function getDecryptedPlatformSecret(key: string): Promise<string | undefined> {
  return runtimeSecret(key);
}
