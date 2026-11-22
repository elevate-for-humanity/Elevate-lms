import {fetchSmoke} from './smoke-fetch.mjs';

/** Retry only a transport-level stall of the already-started, local container.
 * An HTTP response, malformed contract or incorrect SHA is NOT a retryable pass.
 * Every probe still has a hard deadline, and retries are bounded.
 */
export async function smokeProbe(url, options={}, timeoutMs=10000, responseType='json', {
  attempts=3, request=fetchSmoke, pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),
  report=()=>{},
}={}) {
  if (!Number.isInteger(attempts) || attempts<1 || attempts>3) throw new RangeError('Smoke retry budget must be 1..3');
  const target=new URL(url);
  if (target.protocol !== 'http:' || target.hostname !== '127.0.0.1') throw new Error('Smoke probe must target the local container');
  for(let attempt=1;attempt<=attempts;attempt++) {
    report({path:target.pathname,host:options.headers?.host ?? 'default',attempt});
    try {
      return await request(url,options,timeoutMs,responseType);
    } catch(error) {
      const message=error instanceof Error?error.message:'';
      // A timeout after HTTP headers (including a failing status) is not
      // transport uncertainty: do not allow a later healthy request to mask it.
      const beforeHeaders = error?.headersReceived === false;
      const retryable = beforeHeaders && (
        /^Smoke HTTP response timed out after \d+ ms$/.test(message) ||
        message === 'fetch failed' || error?.name === 'AbortError'
      );
      if (!retryable || attempt===attempts) {
        throw new Error(`Smoke request ${target.pathname} (${options.headers?.host ?? 'default'}) failed at attempt ${attempt}/${attempts}: ${retryable ? 'local_transport_timeout' : 'response_unreadable'}`,{cause:error});
      }
      await pause(1000);
    }
  }
  throw new Error('Smoke retry budget exhausted');
}
