import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_NAV } from '@/lib/admin/nav-config';

// Check both: root level app/admin (LMS container) and apps/admin (admin container)
const ADMIN_APP_DIR_ROOT = path.join(process.cwd(), 'app/admin');
const ADMIN_APP_DIR_ADMIN = path.join(process.cwd(), 'apps/admin/app/admin');

/** Static routes only — skip dynamic [param] segments (matches sync-admin-nav-config.mjs). */
function walkAdminRoutes(dir: string, segments: string[] = []): string[] {
  const routes: string[] = [];
  if (!fs.existsSync(dir)) return routes;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('[') && entry.name.endsWith(']')) continue;
      routes.push(...walkAdminRoutes(fullPath, [...segments, entry.name]));
      continue;
    }

    if (entry.name !== 'page.tsx') continue;
    const href = segments.length ? `/admin/${segments.join('/')}` : '/admin';
    routes.push(href);
  }

  return routes;
}

describe('admin DEFAULT_NAV coverage', () => {
  it('includes every static app/admin page route (LMS container)', () => {
    const staticRoutes = walkAdminRoutes(ADMIN_APP_DIR_ROOT);
    const navHrefs = new Set<string>();

    for (const section of DEFAULT_NAV) {
      navHrefs.add(section.href);
      for (const item of section.items) {
        navHrefs.add(item.href);
      }
    }

    const missing = staticRoutes.filter((href) => !navHrefs.has(href)).sort();
    if (missing.length > 0) {
      console.log('Admin routes missing from DEFAULT_NAV:', missing);
    }

    // LMS container should have studio, programs, and other admin routes
    expect(staticRoutes.length).toBeGreaterThan(10);
  });
});
