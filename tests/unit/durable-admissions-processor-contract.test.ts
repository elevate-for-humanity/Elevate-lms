import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const processor = readFileSync(join(root, 'apps/admin/app/api/cron/process-application-submissions/route.ts'), 'utf8');
const schedule = readFileSync(join(root, '.github/workflows/cron-scheduler.yml'), 'utf8');
const staffTasks = readFileSync(join(root, 'apps/admin/app/staff-portal/tasks/page.tsx'), 'utf8');

describe('durable admissions application submission processor contract', () => {
  it('requires the cron bearer token before opening the Admin database', () => {
    expect(processor).toContain("req.headers.get('authorization') !== `Bearer ${cronSecret}`");
    expect(processor).toContain("if (!cronSecret ||");
    expect(processor.indexOf("req.headers.get('authorization')")).toBeLessThan(
      processor.indexOf("const db = await requireAdminClient();", processor.indexOf('async function _GET')),
    );
  });

  it('has a scheduled route and reports HTTP failures as critical queue failures', () => {
    expect(schedule).toContain("github.event.inputs.job == 'application-submissions'");
    expect(schedule).toContain('GET "$ADMIN_URL/api/cron/process-application-submissions"');
    expect(schedule).toContain('id: application_submissions');
    expect(schedule).toContain('APPLICATION_RESULT: ${{ steps.application_submissions.outcome }}');
  });

  it('claims each due job by exact prior state and attempt budget', () => {
    expect(processor).toContain(".in('status', ['pending', 'processing'])");
    expect(processor).toContain("if (previousAttempts >= maxAttempts)");
    expect(processor).toContain(".eq('status', job.status)");
    expect(processor).toContain(".eq('attempts', previousAttempts)");
    expect(processor).toContain("status: 'processing', attempts: attempt, run_after: leaseUntil");
    expect(processor).toContain("status: exhausted ? 'failed' : 'pending'");
    expect(processor).toContain("{ status: failed ? 503 : 200 }");
  });

  it('uses canonical identity, unique CRM email, and reads prior tasks before writing', () => {
    expect(processor).toContain(".from('applications')");
    expect(processor).toContain("Queue identity does not match canonical application");
    expect(processor).toContain(".from('crm_leads')");
    expect(processor).toContain("application.advisor_assigned || null");
    expect(processor).toContain(".eq('related_id', applicationId)");
    expect(processor).toContain(".eq('title', item.title)");
    expect(processor).toContain("if (existingTask) continue");
  });

  it('does not expose unrelated applicant tasks in staff portal', () => {
    expect(staffTasks).toContain(".eq('assigned_to', user.id)");
    expect(staffTasks).toContain(".eq('related_type', 'application')");
  });
});
