import { describe, expect, it } from 'vitest';
import { assertSafePublicImportUrl } from '@/lib/websites/import-site-service';

describe('website import URL boundary', () => {
  it.each([
    'http://127.0.0.1',
    'http://10.0.0.1',
    'http://172.16.0.1',
    'http://192.168.1.1',
    'http://169.254.1.1',
  ])('rejects private IPv4 destination %s', (value) => {
    expect(() => assertSafePublicImportUrl(new URL(value))).toThrow('Private or local network');
  });

  it('accepts a public HTTPS destination', () => {
    expect(() => assertSafePublicImportUrl(new URL('https://example.com'))).not.toThrow();
  });
});
