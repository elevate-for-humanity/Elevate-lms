/** Shared website code reports the deployed service, never a request Host header. */
export function getPublicRuntimeService(
  env: Readonly<Record<string, string | undefined>> = process.env,
): 'marketing' | 'store' {
  // Cloud Run supplies K_SERVICE. Explicit Marketing identity takes precedence
  // over a stale Store flag so the public website cannot mislabel itself.
  if (env.K_SERVICE === 'elevate-marketing-migration') return 'marketing';
  if (env.K_SERVICE === 'elevate-store-migration') return 'store';
  // The image builder renders static pages before Cloud Run supplies K_SERVICE.
  // Use its validated component so Store does not prerender Marketing chrome.
  if (env.APPLICATION_SERVICE === 'marketing') return 'marketing';
  if (env.APPLICATION_SERVICE === 'store') return 'store';
  return env.STORE_ONLY_RUNTIME === 'true' ? 'store' : 'marketing';
}
