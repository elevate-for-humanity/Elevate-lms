import 'server-only';

export const ELEVATE_MEDIA_RUNTIME_KEYS = [
  'ELEVATE_MEDIA_PROVIDER',
  'ELEVATE_MEDIA_ENDPOINT',
  'ELEVATE_MEDIA_REGION',
  'ELEVATE_MEDIA_ACCESS_KEY_ID',
  'ELEVATE_MEDIA_SECRET_ACCESS_KEY',
  'ELEVATE_MEDIA_BUCKET',
  'ELEVATE_MEDIA_PUBLIC_URL',
  'NEXT_PUBLIC_ELEVATE_MEDIA_URL',
  'ELEVATE_MEDIA_FORCE_PATH_STYLE',
  'ELEVATE_MEDIA_VIDEO_MIN_BYTES',
  'COURSE_VIDEO_STORAGE_BACKEND',
] as const;

const MEDIA_KEYS = new Set<string>(ELEVATE_MEDIA_RUNTIME_KEYS);
export function isElevateMediaRuntimeKey(key: string): boolean {
  return MEDIA_KEYS.has(key);
}

export function validateElevateMediaUpdates(updates: Record<string, string>): void {
  for (const [key, value] of Object.entries(updates)) {
    if (!MEDIA_KEYS.has(key)) throw new Error('Unsupported Elevate Media setting');
    if (typeof value !== 'string' || value.length > 16_384 || /[\r\n]/.test(value) || value.includes(String.fromCharCode(0))) {
      throw new Error('Invalid Elevate Media setting value');
    }
    if (/^\s*[•*]{4,}/.test(value)) {
      throw new Error('Masked credentials cannot replace saved credentials');
    }
  }
  const credentialKeys = ['ELEVATE_MEDIA_ACCESS_KEY_ID', 'ELEVATE_MEDIA_SECRET_ACCESS_KEY'];
  if (credentialKeys.some((key) => Object.hasOwn(updates, key))) {
    if (!credentialKeys.every((key) => Boolean(updates[key]?.trim()))) {
      throw new Error('Save the matching Elevate Media key ID and application key together');
    }
  }
}

