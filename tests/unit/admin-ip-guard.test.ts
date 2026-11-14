import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { checkAdminIP } from '@/lib/api/admin-ip-guard';

const originalAllowlist = process.env.ADMIN_IP_ALLOWLIST;

afterEach(() => {
  if (originalAllowlist === undefined) {
    delete process.env.ADMIN_IP_ALLOWLIST;
  } else {
    process.env.ADMIN_IP_ALLOWLIST = originalAllowlist;
  }
});

function requestFrom(ip: string): NextRequest {
  return new NextRequest('https://admin.elevateforhumanity.org/api/admin/health', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('admin IP guard', () => {
  it('allows an address in a configured IPv4 CIDR', () => {
    process.env.ADMIN_IP_ALLOWLIST = '203.0.113.0/24';

    expect(checkAdminIP(requestFrom('203.0.113.42'))).toBeNull();
  });

  it('blocks an address outside the configured IPv4 CIDR', async () => {
    process.env.ADMIN_IP_ALLOWLIST = '203.0.113.0/24';

    const response = checkAdminIP(requestFrom('198.51.100.10'));
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('rejects malformed networks instead of treating them as matches', () => {
    process.env.ADMIN_IP_ALLOWLIST = '203.0.113.999/24,203.0.113.0/33';

    expect(checkAdminIP(requestFrom('203.0.113.42'))?.status).toBe(403);
  });
});
