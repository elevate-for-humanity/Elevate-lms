import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GET as studio } from '@/apps/admin/app/manifest-dev-studio.json/route';
import { GET as courses } from '@/apps/admin/app/manifest-course-builder.json/route';

describe('separate workspace apps', () => {
  it('keeps each installed launcher and its assets within an independent scope', async () => {
    const manifests = await Promise.all([studio(), courses()].map((response) => response.json()));
    expect(new Set(manifests.map((manifest) => manifest.id)).size).toBe(2);
    const entries = [
      ['/install/dev-studio.html', '/studio'],
      ['/install/course-builder.html', '/studio/courses'],
    ];
    for (const [index, manifest] of manifests.entries()) {
      const [launcher, destination] = entries[index];
      expect(manifest.start_url).toBe(launcher);
      expect(manifest.scope).toBe(launcher);
      expect(manifest.display).toBe('standalone');
      const document = readFileSync(`apps/admin/public${launcher}`, 'utf8');
      expect(document).toContain(`href="${destination}"`);
      for (const icon of manifest.icons) {
        expect(icon.src).toMatch(new RegExp(launcher.replace('.html', '-')));
        const png = readFileSync(`apps/admin/public${icon.src}`);
        expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
      }
    }
  });
});
