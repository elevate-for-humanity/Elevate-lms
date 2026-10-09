/** Shared website code reports the deployed service, never a request Host header. */
export function getPublicRuntimeService(
  env: Pick<NodeJS.ProcessEnv, 'K_SERVICE' | 'STORE_ONLY_RUNTIME'> = process.env,
): 'marketing' | 'store' {
  // Cloud Run supplies K_SERVICE. Explicit Marketing identity takes precedence
  // over a stale Store flag so the public website cannot mislabel itself.
  if (env.K_SERVICE === 'elevate-marketing-migration') return 'marketing';
  if (env.K_SERVICE === 'elevate-store-migration') return 'store';
  return env.STORE_ONLY_RUNTIME === 'true' ? 'store' : 'marketing';
}
