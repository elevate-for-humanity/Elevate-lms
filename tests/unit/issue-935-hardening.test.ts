import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('issue #935 production hardening contracts', () => {
  it('surfaces HTTP status and correlation IDs for PARIS failures', () => {
    const page = read('apps/admin/app/paris/page.tsx');
    const route = read('apps/admin/app/api/paris/execute/route.ts');
    expect(page).toContain("'x-correlation-id': correlationId");
    expect(page).toContain('HTTP ${res.status}, correlation ${traceId}');
    expect(route).toContain("'x-correlation-id': correlationId");
  });

  it('loads repository skills server-side without recursive API fetching', () => {
    const route = read('apps/admin/app/api/admin/dev-studio/skills/route.ts');
    const loader = read('lib/studio/repository-skills.ts');
    expect(route).toContain('loadRepositorySkills');
    expect(loader).toContain("path.join(process.cwd(), '.agents', 'skills')");
    expect(loader).not.toContain("fetch('/api/admin/dev-studio/skills')");
  });

  it('publishes approved video candidates into the canonical asset registry', () => {
    const review = read('lib/video/review.ts');
    expect(review).toContain("from('media_assets')");
    expect(review).toContain("review_status: 'approved'");
    expect(review).toContain('source_job_id: job.id');
  });

  it('never displays unverified guardian links', () => {
    const page = read('apps/lms/app/parent-portal/page.tsx');
    expect(page).toContain(".eq('verified', true)");
    expect(page).toContain(".eq('status', 'verified')");
  });

  it('uses the learner-consented candidate directory', () => {
    const page = read('apps/lms/app/employer/candidates/page.tsx');
    expect(page).toContain("from('candidate_employment_profiles')");
    expect(page).toContain(".eq('consent_status', 'granted')");
    expect(page).not.toContain("from('program_enrollments')");
  });
});
