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
});
