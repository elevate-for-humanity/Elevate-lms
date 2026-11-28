import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GET as studio } from '@/apps/admin/app/manifest-dev-studio.json/route';
import { GET as courses } from '@/apps/admin/app/manifest-course-builder.json/route';

const registry = readFileSync('lib/pwa/registry.ts', 'utf8');

describe('separate workspace apps', () => {
  it('gives each workspace app a real manifest identity: the app itself, not its draft pad', async () => {
    const manifests = await Promise.all([studio(), courses()].map((response) => response.json()));
    expect(manifests.map((manifest) => manifest.id)).toEqual([
      'org.elevateforhumanity.dev-studio',
      'org.elevateforhumanity.course-builder',
    ]);
    const entries = [
      ['/studio', '/studio/', '/install/dev-studio.html'],
      ['/studio/courses', '/studio/courses/', '/install/course-builder.html'],
    ];
    for (const [index, manifest] of manifests.entries()) {
      const [appPath, scope, launcher] = entries[index];
      // start_url is the real app and the scope covers it; the static
      // launcher under /install/ is never the installed app.
      expect(manifest.start_url).toBe(appPath);
      expect(manifest.scope).toBe(scope);
      expect(manifest.start_url).not.toBe(launcher);
      expect(manifest.scope).not.toBe(launcher);
      expect(manifest.display).toBe('standalone');
      for (const icon of manifest.icons) {
        expect(icon.src).toMatch(new RegExp(launcher.replace('.html', '-')));
        const png = readFileSync(`apps/admin/public${icon.src}`);
        expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
      }
    }
  });

  it('points every install surface at an in-app route and keeps the launchers as draft pads only', () => {
    expect(registry).toContain("'dev-studio': { name: 'Dev Studio', openPath: '/studio', installPath: '/studio/install' }");
    expect(registry).toContain("'course-builder': { name: 'Course Builder', openPath: '/studio/courses', installPath: '/studio/courses/install' }");
    expect(registry).toContain("email: { name: 'Email', openPath: '/mail', installPath: '/mail/install' }");

    const installRoutes = [
      ['apps/admin/app/studio/install/page.tsx', '/manifest-dev-studio.json'],
      ['apps/admin/app/studio/courses/install/page.tsx', '/manifest-course-builder.json'],
    ];
    for (const [routeFile, manifestPath] of installRoutes) {
      const route = readFileSync(routeFile, 'utf8');
      expect(route).toContain('PwaInstallButton');
      expect(route).toContain(`manifest: '${manifestPath}'`);
    }

    const launchers = [
      ['/install/dev-studio.html', '/studio'],
      ['/install/course-builder.html', '/studio/courses'],
    ];
    for (const [launcher, destination] of launchers) {
      const document = readFileSync(`apps/admin/public${launcher}`, 'utf8');
      // The pad still opens the real app, but it no longer presents itself
      // as the installable app: no manifest link, no install button.
      expect(document).toContain(`href="${destination}"`);
      expect(document).not.toContain('rel="manifest"');
      expect(document).not.toContain('id="install"');
    }
  });
});
