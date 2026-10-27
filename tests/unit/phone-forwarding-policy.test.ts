import { describe, expect, it } from 'vitest';
import { ADMIN_FORWARDING_NUMBER, adminForwardingAllowed } from '@/lib/phone/forwarding-policy';

describe('cellular forwarding policy', () => {
  it('allows only the platform administrator extension', () => {
    expect(adminForwardingAllowed({ tenant_id: null }, { extension: '0' }, ['admin'])).toBe(true);
    expect(ADMIN_FORWARDING_NUMBER).toBe('+13177607908');
    expect(adminForwardingAllowed({ tenant_id: null }, { extension: '104' }, ['admin'])).toBe(false);
    expect(adminForwardingAllowed({ tenant_id: 'customer' }, { extension: '0' }, ['admin'])).toBe(false);
    expect(adminForwardingAllowed({ tenant_id: null }, { extension: '0' }, ['staff'])).toBe(false);
    expect(adminForwardingAllowed({}, { extension: '0' }, ['admin'])).toBe(false);
  });
});
