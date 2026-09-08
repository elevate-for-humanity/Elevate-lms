import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Instructor 48-hour progress report contract', () => {
  const migration = readFileSync(
    'supabase/migrations/20260907050000_instructor_48_hour_progress_reports.sql',
    'utf8',
  );
  const api = readFileSync('apps/admin/app/api/instructor/progress-reports/route.ts', 'utf8');
  const dashboard = readFileSync('apps/admin/app/instructor/dashboard/page.tsx', 'utf8');
  const form = readFileSync('apps/admin/app/instructor/progress/ProgressReportClient.tsx', 'utf8');

  it('stores auditable classroom, hands-on, hours, and testing-readiness evidence', () => {
    expect(migration).toContain('instructional_hours numeric(5,2)');
    expect(migration).toContain('classroom_topics text not null');
    expect(migration).toContain('hands_on_activities text not null');
    expect(migration).toContain('ready_for_testing boolean not null');
    expect(migration).toContain('append-only');
  });

  it('limits instructors to students in their assigned programs', () => {
    expect(api).toContain("from('program_instructors')");
    expect(api).toContain("eq('instructor_id', user.id)");
    expect(api).toContain('This student is not assigned to your program.');
  });

  it('supports voice and manual entry and exposes the form from the dashboard', () => {
    expect(form).toContain('webkitSpeechRecognition');
    expect(form).toContain('Speak this part');
    expect(form).toContain('Save progress form');
    expect(dashboard).toContain('href="/instructor/progress"');
    expect(dashboard).toContain('48-Hour Progress Forms');
  });

  it('queues Elevate notification only for testing-ready submissions', () => {
    expect(api).toContain('if (input.ready_for_testing)');
    expect(api).toContain("from('email_queue').insert");
    expect(api).toContain('is ready for testing');
  });
});
