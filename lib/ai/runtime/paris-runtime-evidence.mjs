/**
 * Independent production evidence for PARIS code repairs.
 *
 * A persisted "exactRuntimeSha" flag is a historical receipt, never proof of
 * the currently serving revision. The caller must check every required origin
 * on every certification attempt.
 */
export async function verifyParisRuntimeOrigins({
  origins, releaseSha, protectedMerge = false, fetchImpl = fetch,
  checkedAt = new Date().toISOString(), timeoutMs = 10_000,
}) {
  if (!/^[a-f0-9]{40}$/.test(String(releaseSha ?? '')) ||
      !Array.isArray(origins) || origins.length === 0) {
    return {passed:false, checkedAt, origins:[]};
  }
  const results = await Promise.all(origins.map(async (origin) => {
    // Do not let an arbitrary URL or credential leak enter this probe.
    const safeOrigin = typeof origin === 'string' && /^https:\/\/[a-z0-9.-]+$/.test(origin);
    if (!safeOrigin) return {origin:String(origin),verified:false,reason:'invalid_origin'};
    try {
      const response = await fetchImpl(origin + '/api/health', {
        cache:'no-store', signal:AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) return {origin,verified:false,reason:'http_' + response.status};
      const body = await response.json();
      const servingSha = body?.commitSha ?? body?.commit ?? body?.sha;
      if (servingSha !== releaseSha) {
        return {origin,verified:false,reason:'revision_mismatch'};
      }
      if (protectedMerge && (body?.healthy !== true || body?.ready !== true)) {
        return {origin,verified:false,reason:'not_ready'};
      }
      return {origin,verified:true,reason:'verified'};
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      const cause = error instanceof Error ? error.cause : null;
      const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
      const reason = name === 'TimeoutError' || name === 'AbortError' ? 'timeout'
        : ['ENOTFOUND','EAI_AGAIN'].includes(code) ? 'dns_unavailable'
        : ['ECONNREFUSED','ECONNRESET','ETIMEDOUT'].includes(code) ? 'connection_unavailable'
        : 'probe_unavailable';
      return {origin,verified:false,reason};
    }
  }));
  return {passed:results.length === origins.length && results.every(x => x.verified),
    checkedAt, origins:results};
}
