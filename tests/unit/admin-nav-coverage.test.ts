import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_NAV } from '@/lib/admin/nav-config';
import { STUDIO_WORKSPACES } from '@/lib/devstudio/workspace-registry';

const ADMIN_APP_DIR = path.join(process.cwd(), 'apps/admin/app');

/** Static routes only — skip dynamic [param] segments (matches sync-admin-nav-config.mjs). */
function walkAdminRoutes(dir: string, segments: string[] = []): string[] {
  const routes: string[] = [];
  if (!fs.existsSync(dir)) return routes;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('[') && entry.name.endsWith(']')) continue;
      if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
        routes.push(...walkAdminRoutes(fullPath, segments));
        continue;
      }
      routes.push(...walkAdminRoutes(fullPath, [...segments, entry.name]));
      continue;
    }

    if (entry.name !== 'page.tsx') continue;
    const href = segments.length ? `/${segments.join('/')}` : '/';
    routes.push(href);
  }

  return routes;
}

describe('admin DEFAULT_NAV coverage', () => {
  it('includes portal management and infrastructure cost dashboard cards in navigation', () => {
    const routes = new Set(DEFAULT_NAV.flatMap(section => section.items.map(item => item.href)));
    expect(['/portals', '/operations/infrastructure-costs'].filter(route => !routes.has(route))).toEqual([]);
  });
  it('exposes every canonical Studio capability under the Dev Studio section', () => {
    const studio = DEFAULT_NAV.find(section => section.label === 'Dev Studio');
    expect(studio).toBeDefined();
    const routes = new Set(studio?.items.map(item => item.href));
    expect(STUDIO_WORKSPACES.filter(workspace => !routes.has(workspace.route)).map(workspace => workspace.id)).toEqual([]);
    expect(routes.has('/studio')).toBe(true);
  });
  it('points every default navigation entry at a real Admin page', () => {
    const staticRoutes = new Set(walkAdminRoutes(ADMIN_APP_DIR));
    const navHrefs = new Set<string>();

    for (const section of DEFAULT_NAV) {
      navHrefs.add(section.href);
      for (const item of section.items) {
        navHrefs.add(item.href);
      }
    }

    const missing = [...navHrefs]
      .filter((href) => !staticRoutes.has(href.split(/[?#]/, 1)[0]))
      .sort();

    expect(staticRoutes.size).toBeGreaterThan(350);
    expect(missing).toEqual([]);
  });
});
