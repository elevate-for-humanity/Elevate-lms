import { describe, expect, it } from 'vitest';
import { taxLoginDestination } from '@/lib/tax-software/login-destination';
const origin = 'https://www.elevateforhumanity.org';
describe('tax sign-in journey', () => {
  it('returns candidates to the chosen role and application section', () => {
    expect(taxLoginDestination('/tax-software/careers?work=office#apply', origin)).toBe(
      '/tax-software/careers?work=office#apply',
    );
  });
  it('returns assigned staff to their office workspace', () => {
    expect(taxLoginDestination('/tax-software/office', origin)).toBe('/tax-software/office');
    expect(taxLoginDestination('/tax-software/self-file/return?id=example', origin)).toBe(
      '/tax-software/self-file/return?id=example',
    );
  });
  it('rejects external, malformed and unrelated return destinations', () => {
    for (const input of [
      'https://evil.example/tax-software/careers',
      '//evil.example/path',
      'javascript:alert(1)',
      '/admin',
      '/tax-software/careers-evil',
      'http://[invalid',
      null,
    ])
      expect(taxLoginDestination(input, origin)).toBe('/tax-software/self-file');
  });
});
