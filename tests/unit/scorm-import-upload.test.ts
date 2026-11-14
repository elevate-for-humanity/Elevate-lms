import { describe, expect, it } from 'vitest';
import { assertScormZip, hasZipSignature, sanitizeScormTitle } from '@/lib/scorm/import-upload';

describe('SCORM import upload contract', () => {
  it('accepts a real ZIP signature and sanitizes its title', async () => {
    const file = new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00])], 'HVAC Core.zip', { type: 'application/zip' });
    expect(() => assertScormZip(file)).not.toThrow();
    expect(await hasZipSignature(file)).toBe(true);
    expect(sanitizeScormTitle('HVAC <Core>.zip')).toBe('HVAC Core');
  });

  it('rejects renamed non-ZIP content', async () => {
    const file = new File([new TextEncoder().encode('not a zip')], 'fake.zip', { type: 'application/zip' });
    expect(await hasZipSignature(file)).toBe(false);
  });

  it('rejects unsupported file types', () => {
    const file = new File(['content'], 'course.pdf', { type: 'application/pdf' });
    expect(() => assertScormZip(file)).toThrow('Only .zip');
  });
});
