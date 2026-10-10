const CHUNK_BYTES = 6 * 1024 * 1024;
const RETRIES = [0, 3000, 5000, 10000, 20000];
function httpError(response, detail) {
  const error = new Error('HTTP ' + response.status + ': ' + detail.slice(0, 200));
  error.status = response.status;
  return error;
}
function retryable(error) {
  return !error.status || [408, 409, 429].includes(error.status) || error.status >= 500;
}
function offsetOf(response, length, fallback) {
  const raw = response.headers.get('upload-offset');
  const offset = raw === null ? fallback : Number(raw);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > length) throw new Error('Invalid resumable upload offset');
  return offset;
}
export async function uploadSupabaseResumable({buffer, endpoint, headers, metadata, request = fetch, delay = ms => new Promise(resolve => setTimeout(resolve, ms))}) {
  const base = new URL(endpoint);
  let created;
  for (const wait of RETRIES) {
    if (wait) await delay(wait);
    try {
      created = await request(base, {method:'POST', headers:{...headers,'Tus-Resumable':'1.0.0','Upload-Length':String(buffer.length),'Upload-Metadata':metadata}, signal:AbortSignal.timeout(30000)});
      if (!created.ok) throw httpError(created, await created.text());
      break;
    } catch (error) {
      if (!retryable(error) || wait === RETRIES.at(-1)) throw error;
    }
  }
  const location = created.headers.get('location');
  if (!location) throw new Error('Resumable upload returned no location');
  const uploadUrl = new URL(location, base);
  if (uploadUrl.origin !== base.origin) throw new Error('Resumable upload location changed origin');
  let offset = offsetOf(created, buffer.length, 0);
  while (offset < buffer.length) {
    const end = Math.min(offset + CHUNK_BYTES, buffer.length);
    let complete = false;
    let lastError;
    for (const wait of RETRIES) {
      if (wait) await delay(wait);
      try {
        const response = await request(uploadUrl, {
          method:'PATCH', headers:{...headers,'Tus-Resumable':'1.0.0','Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'},
          // Rebuild the body after HEAD recovery: the server may have accepted
          // only part of the prior request before the connection disappeared.
          body:new Uint8Array(buffer.subarray(offset, end)), signal:AbortSignal.timeout(120000),
        });
        if (!response.ok) throw httpError(response, await response.text());
        const next = offsetOf(response, buffer.length);
        if (next <= offset || next > end) throw new Error('Resumable upload did not confirm the submitted bytes');
        offset = next;
        if (offset === end) {complete = true; break;}
      } catch (error) {
        lastError = error;
        if (!retryable(error)) throw error;
        try {
          const response = await request(uploadUrl, {method:'HEAD',headers:{...headers,'Tus-Resumable':'1.0.0'},signal:AbortSignal.timeout(30000)});
          if (!response.ok) throw httpError(response, await response.text());
          const next = offsetOf(response, buffer.length);
          if (next < offset || next > end) throw new Error('Resumable recovery offset is outside the submitted range', {cause: error});
          offset = next;
          if (offset === end) {complete = true; break;}
        } catch (error) {
          if (!retryable(error)) throw error;
          lastError = error;
        }
      }
    }
    if (!complete) throw new Error('Resumable upload failed at byte ' + offset + ': ' + (lastError?.message || 'incomplete transfer'));
  }
}
