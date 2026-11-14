/** Fetch a live Admin identity for non-delivering voicemail acceptance.
 * Retry only transient request timeouts; never treat an HTTP or identity
 * failure as healthy and never trigger voicemail processing on a failed read.
 */
export async function readVoicemailAdminHealth(
  base,
  request = fetch,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await request(`${base}/api/health`, {
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`VOICEMAIL_ADMIN_HEALTH_HTTP_${response.status}`);
      const health = await response.json();
      if (!/^[a-f0-9]{40}$/.test(health?.commit || '')) {
        throw new Error('VOICEMAIL_ADMIN_HEALTH_IDENTITY_INVALID');
      }
      return health;
    } catch (error) {
      if (error?.name !== 'TimeoutError') throw error;
      if (attempt === 3) throw new Error('VOICEMAIL_ADMIN_HEALTH_TIMEOUT_EXHAUSTED');
      await wait(attempt * 500);
    }
  }
  throw new Error('VOICEMAIL_ADMIN_HEALTH_UNREACHABLE');
}
