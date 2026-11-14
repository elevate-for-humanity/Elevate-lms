import { describe, it, expect, vi, afterEach } from 'vitest';
import { sealTaxPrivateFields, openTaxPrivateFields } from '@/lib/tax-software/security/encryption';
const key = '19'.repeat(32);
afterEach(() => vi.unstubAllEnvs());
describe('private tax data encryption', () => {
  it('round trips with authenticated encryption without including plaintext in storage', () => {
    const data = { ssn: '400001037', pin: '12345' };
    const encrypted = sealTaxPrivateFields(data, 'user-a', 'return-a', key);
    expect(encrypted).not.toContain(data.ssn);
    expect(openTaxPrivateFields(encrypted, 'user-a', 'return-a', key)).toEqual(data);
  });
  it('prevents copying an encrypted profile to another user or return', () => {
    const encrypted = sealTaxPrivateFields({ test: true }, 'user-a', 'return-a', key);
    expect(() => openTaxPrivateFields(encrypted, 'user-b', 'return-a', key)).toThrow();
    expect(() => openTaxPrivateFields(encrypted, 'user-a', 'return-b', key)).toThrow();
  });
  it('rejects tampering', () => {
    const encrypted = sealTaxPrivateFields({ test: true }, 'user-a', 'return-a', key);
    const parts = encrypted.split('.');
    parts[2] = Buffer.alloc(16).toString('base64url');
    expect(() => openTaxPrivateFields(parts.join('.'), 'user-a', 'return-a', key)).toThrow();
  });
  it('uses independent nonces for repeated saves', () => {
    expect(sealTaxPrivateFields({ test: true }, 'u', 'r', key)).not.toBe(
      sealTaxPrivateFields({ test: true }, 'u', 'r', key),
    );
  });
  it('never saves unencrypted data when no key is configured', () => {
    vi.stubEnv('TAX_DATA_ENCRYPTION_KEY', '');
    vi.stubEnv('SSN_ENCRYPTION_KEY', '');
    expect(() => sealTaxPrivateFields({ test: true }, 'u', 'r')).toThrow('not configured');
  });
});
