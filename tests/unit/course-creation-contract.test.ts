import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');

describe('course creation authority', () => {
  const canonical = read('apps/admin/app/api/admin/courses/route.ts');
  const retired = read('apps/admin/app/api/admin/lms/courses/route.ts');

  it('keeps course creation in the canonical admin courses endpoint', () => {
    expect(canonical).toContain('export const POST = withAuth');
    expect(canonical).toContain('{ roles: API_ADMIN_ROLES }');
    expect(canonical).toContain("from('courses')");
  });

  it('requires the fields needed by the persisted course contract', () => {
    expect(canonical).toContain('!input.title || !input.slug || !input.description');
    expect(canonical).toContain("'title, slug, and description are required'");
  });

  it('returns the persisted database row as the creation result', () => {
    expect(canonical).toMatch(/NextResponse\.json\(data, \{ status: 201,/);
  });

  it('keeps the parallel LMS creation route retired', () => {
    expect(retired).toContain('status: 405');
    expect(retired).toContain('/api/admin/courses');
    expect(retired).not.toContain("from('courses').insert");
  });
});
