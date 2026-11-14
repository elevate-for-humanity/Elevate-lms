/** Security contracts for routes owned by the canonical LMS container. */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(path), 'utf8');

describe('course content authorization', () => {
  it('keeps public lesson detail behind a user-scoped client', () => {
    const route = source('apps/lms/app/api/courses/[courseId]/lessons/public/route.ts');
    expect(route).toContain('getUser');
    expect(route).not.toContain('getAdminClient');
  });

  it('requires authentication before returning course modules', () => {
    const route = source('apps/lms/app/api/courses/[courseId]/modules/route.ts');
    expect(route).toContain('getUser');
    expect(route).toContain('401');
  });
});

describe('enrollment IDOR protection', () => {
  it('scopes non-admin enrollment lookup to the authenticated user', () => {
    const route = source('apps/lms/app/api/enrollments/[id]/route.ts');
    expect(route).toContain('apiAuthGuard');
    expect(route).toContain("query.eq('user_id', auth.id)");
    expect(route.indexOf('apiAuthGuard')).toBeLessThan(route.indexOf("from('program_enrollments')"));
  });
});

describe('retired root API surface', () => {
  it('does not restore unowned quiz and privacy endpoints in the deleted root app', () => {
    expect(existsSync(resolve('app/api/quizzes/[quizId]/route.ts'))).toBe(false);
    expect(existsSync(resolve('app/api/privacy/export/route.ts'))).toBe(false);
    expect(existsSync(resolve('app/api/privacy/delete/route.ts'))).toBe(false);
  });
});
