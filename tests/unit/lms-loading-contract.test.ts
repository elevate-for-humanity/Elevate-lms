import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('LMS navigation loading contract', () => {
  it('uses an unobtrusive progress indicator instead of a branded full-page shell', () => {
    const source = fs.readFileSync(path.join(root, 'apps/lms/app/loading.tsx'), 'utf8');

    expect(source).toContain('fixed inset-x-0 top-0');
    expect(source).not.toContain('min-h-dvh');
    expect(source).not.toContain('Elevate_for_Humanity_logo');
    expect(source).not.toContain('<img');
  });

  it('refreshes document data without a full browser reload', () => {
    const source = fs.readFileSync(
      path.join(root, 'apps/lms/app/apprentice/documents/UploadDocuments.tsx'),
      'utf8',
    );

    expect(source).toContain('router.refresh()');
    expect(source).not.toContain('window.location.reload()');
  });
});
