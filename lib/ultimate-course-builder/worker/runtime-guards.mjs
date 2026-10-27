/** Queue traffic has bounded deadlines. Only reads and the idempotent fenced
 * heartbeat RPC may be replayed; claims/publication/writes never are. */
export function createWorkerSupabaseFetch({request = globalThis.fetch, timeoutMs = 5000, writeTimeoutMs = 30000, attempts = 3, delay = ms => new Promise(resolve => setTimeout(resolve, ms))} = {}) {
  return async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const safe = ['GET','HEAD'].includes(method) || (method === 'POST' && url.pathname === '/rest/v1/rpc/heartbeat_ultimate_build_job');
    const external = init.signal || (input instanceof Request ? input.signal : undefined);
    const count = safe ? attempts : 1;
    for (let attempt = 0; attempt < count; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), safe ? timeoutMs : writeTimeoutMs);
      try {
        const response = await request(input instanceof Request ? input.clone() : input, {...init, signal: external ? AbortSignal.any([external,controller.signal]) : controller.signal});
        // Include the small PostgREST response body in the request deadline.
        const bytes = await response.arrayBuffer();
        if (safe && [429,500,502,503,504].includes(response.status) && attempt + 1 < count) {
          if (external?.aborted) throw external.reason;
        } else {
          return new Response([204,205,304].includes(response.status) ? null : bytes, {status:response.status,statusText:response.statusText,headers:response.headers});
        }
      } catch (error) {
        if (external?.aborted || attempt + 1 >= count) throw error;
      } finally { clearTimeout(timer); }
      await delay(150 * (attempt + 1));
    }
    throw new Error('ULTIMATE_WORKER_REQUEST_EXHAUSTED');
  };
}

/** Loss of lease ends the finite task even if a media promise never returns.
 * Expiry cannot be renewed locally; the database remains the ownership authority. */
export function createLeaseDeadline(jobId, {leaseMs = 300000, now = Date.now, schedule = setTimeout, cancel = clearTimeout, onLost = () => {}} = {}) {
  let expiresAt = now() + leaseMs, lost = false, timer, rejectExpiry;
  const expired = new Promise((_, reject) => { rejectExpiry = reject; });
  expired.catch(() => {});
  const lose = () => {
    if (lost) return;
    lost = true; onLost(); cancel(timer);
    rejectExpiry(new Error('ULTIMATE_JOB_LEASE_LOST:' + jobId));
  };
  const arm = () => { cancel(timer); timer = schedule(lose, Math.max(0,expiresAt - now())); };
  arm();
  return {
    renew() {
      if (lost || now() >= expiresAt) { lose(); return false; }
      expiresAt = now() + leaseMs; arm(); return true;
    },
    lose,
    assertActive() {
      if (lost || now() >= expiresAt) { lose(); throw new Error('ULTIMATE_JOB_LEASE_LOST:' + jobId); }
    },
    race(work) { return Promise.race([work, expired]); },
    dispose() { cancel(timer); },
  };
}
