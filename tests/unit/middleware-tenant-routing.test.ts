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

  it('wires tenant subdomains into the actual Marketing middleware', () => {
    const source = readFileSync(join(process.cwd(), 'apps/marketing/middleware.ts'), 'utf8');
    expect(source).toContain('tenantSlugFromAppHost(host)');
    expect(source).toContain('rewriteTenantAppHostRequest');
    expect(source).toContain('rewriteCustomDomainRequest');
  });

  it('routes custom domains through x-tenant-host resolution', () => {
    const routingSource = readFileSync(
      join(process.cwd(), 'lib/tenant/middleware-tenant-routing.ts'),
      'utf8',
    );
    const slugSource = readFileSync(join(process.cwd(), 'lib/tenant/get-tenant-slug.ts'), 'utf8');
    expect(routingSource).toContain("requestHeadersWithTenant.set('x-tenant-host'");
    expect(slugSource).toContain("h.get('x-tenant-host')");
    expect(slugSource).toContain(".from('website_domains')");
  });
});
