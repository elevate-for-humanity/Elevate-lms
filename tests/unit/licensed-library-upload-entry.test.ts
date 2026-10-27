import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('licensed course-media upload entry', () => {
  it('exposes the existing provenance-preserving library workflow from the upload page', () => {
    const page = readFileSync(join(process.cwd(), 'apps/admin/app/videos/upload/page.tsx'), 'utf8');

    expect(page).toContain("params.mode === 'licensed-library'");
    expect(page).toContain('licensedLibrary={licensedLibrary}');
    expect(page).toContain('embedded={licensedLibrary}');
  });

  it('accepts licensed Envato photos as well as clips in both UI and API validation', () => {
    const client = readFileSync(
      join(process.cwd(), 'apps/admin/app/videos/upload/VideoUploadClient.tsx'),
      'utf8',
    );
    const route = readFileSync(
      join(process.cwd(), 'apps/admin/app/api/admin/videos/upload/route.ts'),
      'utf8',
    );

    expect(client).toContain("'image/jpeg'");
    expect(client).toContain("'image/png'");
    expect(client).toContain("'image/webp'");
    expect(route).toContain("'image/jpeg'");
    expect(route).toContain('LICENSED_MEDIA_TYPES.has(fileType)');
  });
});
