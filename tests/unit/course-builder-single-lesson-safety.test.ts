import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Course Builder single-lesson safety', () => {
  const canonicalRoute = readFileSync('apps/admin/app/api/admin/course-builder/route.ts', 'utf8');
  const compatibilityRoute = readFileSync(
    'apps/admin/app/api/admin/courses/[courseId]/generate-videos/route.ts',
    'utf8',
  );
  const mediaService = readFileSync('lib/course-factory/media-service.ts', 'utf8');

  it('requires explicit confirmation before a request can fan out across a course', () => {
    expect(canonicalRoute).toContain("body.scope === 'course' && body.confirmCourseBatch === true");
    expect(compatibilityRoute).toContain(
      "error: 'lessonId is required for single-lesson video production'",
    );
  });

  it('validates the exact scope before reserving generation credits', () => {
    const validation = canonicalRoute.indexOf('const validation = await queueCourseMedia');
    const reservation = canonicalRoute.indexOf('reservation = await reserveCredits', validation);
    expect(validation).toBeGreaterThan(-1);
    expect(reservation).toBeGreaterThan(validation);
    expect(canonicalRoute).toContain("status: validateOnly ? 'validated' : 'already_active'");
    expect(canonicalRoute).toContain('charged: false');
  });

  it('keeps validation side-effect free and reports already active work', () => {
    expect(mediaService).toContain('validateOnly?: boolean');
    expect(mediaService).toContain('if (input.validateOnly)');
    expect(mediaService).toContain('alreadyActive += 1');
    expect(mediaService).toContain('wouldQueue += 1');
  });

  it('forwards the idempotency key through the legacy adapter', () => {
    expect(compatibilityRoute).toContain("request.headers.get('idempotency-key')");
    expect(compatibilityRoute).toContain("headers.set('idempotency-key', idempotencyKey)");
  });
});
