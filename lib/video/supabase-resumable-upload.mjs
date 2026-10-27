import { open } from 'node:fs/promises';
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
export async function uploadSupabaseResumable({buffer, size = buffer?.length, readChunk = undefined, endpoint, headers, metadata, request = fetch, delay = ms => new Promise(resolve => setTimeout(resolve, ms))}) {
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error('Resumable source size is invalid');
  const source = readChunk ?? ((start, end) => new Uint8Array(buffer.subarray(start, end)));
  const base = new URL(endpoint);
  let created;
  for (const wait of RETRIES) {
    if (wait) await delay(wait);
    try {
      created = await request(base, {method:'POST', headers:{...headers,'Tus-Resumable':'1.0.0','Upload-Length':String(size),'Upload-Metadata':metadata}, signal:AbortSignal.timeout(30000)});
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
  let offset = offsetOf(created, size, 0);
  while (offset < size) {
    const end = Math.min(offset + CHUNK_BYTES, size);
    let complete = false;
    let lastError;
    for (const wait of RETRIES) {
      if (wait) await delay(wait);
      try {
        const response = await request(uploadUrl, {
          method:'PATCH', headers:{...headers,'Tus-Resumable':'1.0.0','Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'},
          // Rebuild the body after HEAD recovery: the server may have accepted
          // only part of the prior request before the connection disappeared.
          body:await source(offset, end), signal:AbortSignal.timeout(120000),
        });
        if (!response.ok) throw httpError(response, await response.text());
        const next = offsetOf(response, size);
        if (next <= offset || next > end) throw new Error('Resumable upload did not confirm the submitted bytes');
        offset = next;
        if (offset === end) {complete = true; break;}
      } catch (error) {
        lastError = error;
        if (!retryable(error)) throw error;
        try {
          const response = await request(uploadUrl, {method:'HEAD',headers:{...headers,'Tus-Resumable':'1.0.0'},signal:AbortSignal.timeout(30000)});
          if (!response.ok) throw httpError(response, await response.text());
          const next = offsetOf(response, size);
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

export async function uploadSupabaseResumableFile({filePath, ...options}) {
 const file = await open(filePath, 'r');
 try {
  const {size} = await file.stat();
  return await uploadSupabaseResumable({...options, size, readChunk: async (start, end) => {
   const bytes = Buffer.alloc(end - start);
   let filled = 0;
   while (filled < bytes.length) {
    const result = await file.read(bytes, filled, bytes.length - filled, start + filled);
    if (!result.bytesRead) throw new Error('Resumable file ended before its declared size');
    filled += result.bytesRead;
   }
   return bytes;
  }});
 } finally { await file.close(); }
}
