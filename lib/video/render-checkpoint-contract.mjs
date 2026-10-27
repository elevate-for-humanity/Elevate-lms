import {createHash} from 'node:crypto';

// Shared by lesson evidence and encoded segment storage. Bump only when the
// rendering contract changes; unrelated application releases keep checkpoints.
export const STORYBOARD_RENDER_PRODUCER = 'approved-bold-captions-speech-cued-photo-tracking-v4';
// Renewable credentials are access to an asset, not the identity of its bytes.
// Preserve object paths, version IDs and all content-affecting query values.
const s3Credentials = new Set(['x-amz-algorithm','x-amz-credential','x-amz-date','x-amz-expires','x-amz-signedheaders','x-amz-signature','x-amz-security-token']);
function checkpointIdentity(_key, value) {
  if (typeof value !== 'string' || !value.startsWith('https://')) return value;
  let url;
  try { url = new URL(value); } catch { return value; }
  let changed = false;
  for (const key of [...url.searchParams.keys()]) {
    if (s3Credentials.has(key.toLowerCase()) ||
        (key === 'token' && url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/v1/object/sign/'))) {
      url.searchParams.delete(key);changed = true;
    }
  }
  return changed ? url.href : value;
}
export function storyboardRenderFingerprint(input, producer=STORYBOARD_RENDER_PRODUCER) {
  return createHash('sha256').update(JSON.stringify({...input,producer},checkpointIdentity)).digest('hex').slice(0,24);
}
