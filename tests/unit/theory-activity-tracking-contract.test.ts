import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260916221500_add_verified_theory_activity_sessions.sql',
  'utf8',
);
const sessionRoute = readFileSync('apps/lms/app/api/theory/session/route.ts', 'utf8');
const lessonClient = readFileSync(
  'apps/lms/app/lms/courses/[courseId]/lessons/[lessonId]/LessonProgressClient.tsx',
  'utf8',
);
const completionRoute = readFileSync(
  'apps/lms/app/api/lessons/[lessonId]/complete/route.ts',
  'utf8',
);
const clockRoute = readFileSync('apps/lms/app/api/timeclock/action/route.ts', 'utf8');

describe('apprenticeship theory activity tracking contract', () => {
  it('measures server-side heartbeat intervals and caps weekly theory at ten hours', () => {
    expect(migration).toContain('record_theory_activity_heartbeat');
    expect(migration).toContain('least(greatest(floor(extract(epoch');
    expect(migration).toContain('v_remaining := greatest(36000-v_weekly,0)');
    expect(migration).toContain("status='blocked'");
  });

  it('does not expose the heartbeat credit function to learner roles', () => {
    expect(migration).toContain(
      'revoke all on function public.record_theory_activity_heartbeat(uuid,uuid) from public,anon,authenticated',
    );
    expect(migration).toContain(
      'grant execute on function public.record_theory_activity_heartbeat(uuid,uuid) to service_role',
    );
  });

  it('pauses hidden and inactive lesson sessions', () => {
    expect(lessonClient).toContain("document.addEventListener('visibilitychange'");
    expect(lessonClient).toContain('Date.now() - lastActivityAt.current > 90_000');
    expect(lessonClient).toContain("action: 'heartbeat'");
    expect(lessonClient).toContain('Active lesson time is being recorded');
  });

  it('prevents theory and OJL from overlapping in both directions', () => {
    expect(sessionRoute).toContain("code: 'OJL_OVERLAP'");
    expect(clockRoute).toContain("code: 'THEORY_SESSION_ACTIVE'");
    expect(migration).toContain('pe.clock_in_at is not null and pe.clock_out_at is null');
  });

  it('uses recorded server activity for apprentice lesson seat time', () => {
    expect(completionRoute).toContain(".from('theory_activity_sessions')");
    expect(completionRoute).toContain('effectiveTimeSpentSeconds');
    expect(completionRoute).toContain('recordStepCompletion');
  });
});
