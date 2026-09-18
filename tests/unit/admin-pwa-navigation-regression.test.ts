import fs from 'node:fs';
import path from 'node:path';

describe('admin PWA navigation', () => {
  const root = process.cwd();

  it('keeps dashboard and phone system reachable from the full-screen Studio', () => {
    const source = fs.readFileSync(
      path.join(root, 'components/studio/StudioCommandWorkspace.tsx'),
      'utf8',
    );

    expect(source).toContain('href="/dashboard"');
    expect(source).toContain('href="/phone"');
    expect(source).toContain('aria-label="Open phone system"');
  });

  it('exposes dashboard and phone shortcuts in the installed admin app', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, 'public/manifest-admin.json'), 'utf8'),
    ) as { start_url?: string; shortcuts?: Array<{ url?: string }> };

    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.shortcuts?.some((shortcut) => shortcut.url === '/dashboard')).toBe(true);
    expect(manifest.shortcuts?.some((shortcut) => shortcut.url === '/phone')).toBe(true);
  });

  it('shows phone system in the dashboard workspace catalog', () => {
    const source = fs.readFileSync(
      path.join(root, 'components/admin/dashboard/DashboardShell.tsx'),
      'utf8',
    );

    expect(source).toContain("title: 'Phone System'");
    expect(source).toContain("href: '/phone'");
  });
});
