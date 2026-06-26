import { describe, expect, it } from 'vitest';
import {
  isTenantAppSubdomainHost,
  tenantSlugFromAppHost,
} from '@/lib/tenant/middleware-tenant-routing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('middleware tenant routing', () => {
  it('extracts slug from app subdomain', () => {
    expect(tenantSlugFromAppHost('acme.app.elevateforhumanity.org')).toBe('acme');
    expect(isTenantAppSubdomainHost('acme.app.elevateforhumanity.org')).toBe(true);
  });

  it('rejects apex and nested hosts', () => {
    expect(tenantSlugFromAppHost('app.elevateforhumanity.org')).toBeNull();
    expect(tenantSlugFromAppHost('www.elevateforhumanity.org')).toBeNull();
    expect(tenantSlugFromAppHost('foo.bar.app.elevateforhumanity.org')).toBeNull();
  });

  it('strips port from host', () => {
    expect(tenantSlugFromAppHost('demo.app.elevateforhumanity.org:3000')).toBe('demo');
  });

  it('routes app apex host admin paths to admin dashboard', () => {
    const proxySource = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf8');
    const appHostBlock = proxySource.slice(
      proxySource.indexOf("hostWithoutPort === 'app.elevateforhumanity.org'"),
      proxySource.indexOf('// {subdomain}.app.elevateforhumanity.org'),
    );

    // app.elevateforhumanity.org/admin routes to admin dashboard
    expect(appHostBlock).toContain("'/admin/dashboard'");
    expect(appHostBlock).toContain("rewriteUrl.pathname = adminPath");
  });

  it('validates canonical admin host configuration', () => {
    const proxySource = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf8');
    // proxy.ts validates that app.elevateforhumanity.org is not used as admin host
    expect(proxySource).toContain('canonicalAdminHost');
    expect(proxySource).toContain('hostWithoutPort === canonicalAdminHost');
  });
});
