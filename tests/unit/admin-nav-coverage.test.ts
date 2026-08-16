import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_NAV } from '@/lib/admin/nav-config';

const ADMIN_APP_DIR = path.join(process.cwd(), 'apps/admin/app');

/** Static routes only — skip dynamic segments and omit Next route-group names from URLs. */
function walkAdminRoutes(dir: string, segments: string[] = []): string[] {
  const routes: string[] = [];
  if (!fs.existsSync(dir)) return routes;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('[') && entry.name.endsWith(']')) continue;
      const nextSegments =
        entry.name.startsWith('(') && entry.name.endsWith(')')
          ? segments
          : [...segments, entry.name];
      routes.push(...walkAdminRoutes(fullPath, nextSegments));
      continue;
    }

    if (entry.name !== 'page.tsx') continue;
    const href = segments.length ? `/${segments.join('/')}` : '/';
    routes.push(href);
  }

  return routes;
}

describe('admin DEFAULT_NAV coverage', () => {
  it('audits the canonical apps/admin route tree rather than the retired root app/admin tree', () => {
    const staticRoutes = walkAdminRoutes(ADMIN_APP_DIR);
    const navHrefs = new Set<string>();

    for (const section of DEFAULT_NAV) {
      navHrefs.add(section.href);
      for (const item of section.items) navHrefs.add(item.href);
    }

    const covered = staticRoutes.filter((href) => navHrefs.has(href));

    expect(staticRoutes.length).toBeGreaterThan(10);
    expect(covered.length).toBeGreaterThan(10);
    expect(staticRoutes).toContain('/dashboard');
  });
});
