import { randomUUID } from 'node:crypto';

export const MAX_SCORM_PACKAGE_BYTES = 500 * 1024 * 1024;

export function sanitizeScormTitle(value: unknown): string {
  const title = String(value ?? '').replace(/\.zip$/i, '').replace(/[^a-z0-9 _.-]+/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!title) throw new Error('A SCORM package title is required');
  return title.slice(0, 160);
}

export function assertScormZip(file: File): void {
  if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('Only .zip SCORM packages are supported');
  if (file.size <= 0) throw new Error('The SCORM package is empty');
  if (file.size > MAX_SCORM_PACKAGE_BYTES) throw new Error('The SCORM package exceeds the 500 MB limit');
  if (file.type && !['application/zip', 'application/x-zip-compressed', 'application/octet-stream'].includes(file.type)) {
    throw new Error('The uploaded file is not a supported ZIP package');
  }
}

export async function hasZipSignature(file: File): Promise<boolean> {
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (signature.length < 4 || signature[0] !== 0x50 || signature[1] !== 0x4b) return false;
  return (
    (signature[2] === 0x03 && signature[3] === 0x04) ||
    (signature[2] === 0x05 && signature[3] === 0x06) ||
    (signature[2] === 0x07 && signature[3] === 0x08)
  );
}

export function scormStoragePath(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'course';
  return `imports/${new Date().toISOString().slice(0, 10)}/${slug}-${randomUUID()}.zip`;
}
