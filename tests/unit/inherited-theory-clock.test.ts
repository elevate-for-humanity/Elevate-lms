import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
import { POST } from '@/apps/lms/app/api/theory/session/route';

vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));
vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => ({ id: 'learner' })) }));
vi.mock('@/lib/lms/access-control', () => ({
  assertLessonAccess: vi.fn(async () => {}),
  accessErrorResponse: () => ({ status: 403, body: { error: 'Denied' } }),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
vi.mock('@/lib/enrollment/resolve-course-enrollment', () => ({ resolveCourseEnrollment: vi.fn() }));

let inserted: boolean;
let schedule: { id: string } | null;
let scheduleError: { message: string } | null;
let overlap: boolean;

function database() {
  return {
    from(table: string) {
      let operation = 'select';
      const chain = {
        select() { return chain; },
        eq() { return chain; },
        order() { return chain; },
        limit() { return chain; },
        update() { operation = 'update'; return chain; },
        insert() { operation = 'insert'; inserted = true; return chain; },
        maybeSingle() {
          if (table === 'apprentices') return Promise.resolve({ data: null, error: null });
          if (table === 'apprenticeship_theory_schedules')
            return Promise.resolve({ data: schedule, error: scheduleError });
          return Promise.resolve({ data: { id: 'lesson', course_id: 'course' }, error: null });
        },
        single() { return Promise.resolve({ data: { id: 'session', active_seconds: 0 }, error: null }); },
        then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
          return Promise.resolve({ data: operation === 'select' ? [] : null, error: null }).then(resolve, reject);
        },
      };
      return chain;
    },
    rpc: async () => ({ data: overlap, error: null }),
  };
}

async function start() {
  return POST(new NextRequest('https://lms.example/api/theory/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Theory starts without requesting or supplying location coordinates.
    body: JSON.stringify({ action: 'start', courseId: 'course', lessonId: 'lesson' }),
  }));
}

beforeEach(() => {
  inserted = false;
  schedule = { id: 'assigned-schedule' };
  scheduleError = null;
  overlap = false;
  vi.mocked(requireAdminClient).mockResolvedValue(database() as never);
  vi.mocked(resolveCourseEnrollment).mockResolvedValue({
    id: 'enrollment', status: 'active', program_id: 'program', funding_program_id: null,
    course_id: 'course', user_id: 'learner', student_id: 'learner',
  });
});

describe('inherited apprenticeship theory clock', () => {
  it('records a scheduled learner without a legacy apprentice profile or geolocation', async () => {
    const response = await start();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ tracked: true, sessionId: 'session' });
    expect(inserted).toBe(true);
  });
  it('still requires active course enrollment', async () => {
    vi.mocked(resolveCourseEnrollment).mockResolvedValue(null);
    expect((await start()).status).toBe(403);
    expect(inserted).toBe(false);
  });
  it('fails closed when schedule lookup fails', async () => {
    scheduleError = { message: 'Database unavailable' };
    expect((await start()).status).toBe(503);
    expect(inserted).toBe(false);
  });
  it('does not overlap OJL work time', async () => {
    overlap = true;
    const response = await start();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'OJL_OVERLAP' });
    expect(inserted).toBe(false);
  });
  it('does not turn ordinary learners into apprentices', async () => {
    schedule = null;
    expect(await (await start()).json()).toMatchObject({ tracked: false, reason: 'NOT_APPRENTICE' });
    expect(inserted).toBe(false);
  });
});
