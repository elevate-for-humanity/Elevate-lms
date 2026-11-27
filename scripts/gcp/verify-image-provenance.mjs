import { createHash } from 'node:crypto';

const registry = 'us-central1-docker.pkg.dev';
const repository = 'elegant-racer-299721/elevate';
const components = new Set(['marketing', 'admin', 'lms', 'store']);
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const indexTypes = new Set(['application/vnd.oci.image.index.v1+json', 'application/vnd.docker.distribution.manifest.list.v2+json']);
const manifestTypes = new Set(['application/vnd.oci.image.manifest.v1+json', 'application/vnd.docker.distribution.manifest.v2+json']);
const maxIndexBytes = 2 * 1024 * 1024;

function imageDigest(component, image) {
  if (!components.has(component) || typeof image !== 'string') return null;
  const prefix = `${registry}/${repository}/${component}@`;
  if (!image.startsWith(prefix)) return null;
  const digest = image.slice(prefix.length);
  return digestPattern.test(digest) ? digest : null;
}

// Cloud Run may resolve an OCI image index to its Linux/amd64 child manifest.
// Accept that child only when the *raw immutable index bytes* hash to the
// commit-tag digest and contain exactly one runnable matching descriptor.
// Build attestations (unknown/unknown) and unrelated repository images never qualify.
export function imageRelationship(component, revisionImage, commitImage, indexBytes) {
  const revisionDigest = imageDigest(component, revisionImage);
  const commitDigest = imageDigest(component, commitImage);
  if (!revisionDigest || !commitDigest) return 'unverified';
  if (revisionDigest === commitDigest) return 'exact';
  if (!(indexBytes instanceof Uint8Array) || !indexBytes.length || indexBytes.length > maxIndexBytes) return 'unverified';
  if ('sha256:' + createHash('sha256').update(indexBytes).digest('hex') !== commitDigest) return 'unverified';
  let index;
  try { index = JSON.parse(Buffer.from(indexBytes).toString('utf8')); }
  catch { return 'unverified'; }
  if (index?.schemaVersion !== 2 || !indexTypes.has(index.mediaType) || !Array.isArray(index.manifests)) return 'unverified';
  const runnable = index.manifests.filter(entry => entry?.platform?.os === 'linux' && entry.platform.architecture === 'amd64');
  if (runnable.length !== 1) return 'unverified';
  const entry = runnable[0];
  if (!manifestTypes.has(entry.mediaType) || !digestPattern.test(entry.digest ?? '') ||
      !Number.isSafeInteger(entry.size) || entry.size <= 0 || entry.artifactType ||
      entry.annotations?.['vnd.docker.reference.type'] === 'attestation-manifest') return 'unverified';
  return entry.digest === revisionDigest ? 'linux-amd64-child' : 'unverified';
}

// Read the commit's immutable digest, never a mutable tag or a manifest-supplied
// URL. The caller obtains an OAuth access token using its existing Google identity.
// No token, response body, or transport exception is written to verification evidence.
export async function readCommitIndex(component, commitImage, accessToken, request = fetch) {
  const digest = imageDigest(component, commitImage);
  if (!digest || typeof accessToken !== 'string' || !accessToken.trim()) throw new Error('REGISTRY_INDEX_IDENTITY_REQUIRED');
  const url = `https://${registry}/v2/${repository}/${component}/manifests/${digest}`;
  const response = await request(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: [...indexTypes, ...manifestTypes].join(', ') },
    redirect: 'error', signal: AbortSignal.timeout(20000),
  });
  if (!response.ok || !response.body) throw new Error('REGISTRY_INDEX_READ_FAILED');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxIndexBytes) {
        await reader.cancel();
        throw new Error('REGISTRY_INDEX_TOO_LARGE');
      }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, size);
}
