import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspace = fs.readFileSync(
  path.resolve('components/program-holder/ProgramHolderWorkspaceView.tsx'),
  'utf8',
);
const guard = fs.readFileSync(path.resolve('lib/auth/require-program-holder.ts'), 'utf8');
const payment = fs.readFileSync(path.resolve('lib/program-holder/release-payment.ts'), 'utf8');
const mou = fs.readFileSync(path.resolve('apps/lms/app/program-holder/sign-mou/page.tsx'), 'utf8');
const holderData = fs.readFileSync(path.resolve('lib/program-holder/workspace.ts'), 'utf8');
const callList = fs.readFileSync(path.resolve('components/program-holder/CallListPanel.tsx'), 'utf8');
const closeout = fs.readFileSync(
  path.resolve('components/program-holder/ProgramHolderStudentCloseoutForm.tsx'),
  'utf8',
);

describe('program-holder dashboard hero', () => {
  it('keeps the long program list and decorative hero out of the home queue', () => {
    expect(workspace).not.toContain('function DashboardHero(');
    expect(workspace).not.toContain(".filter(Boolean).join(', ')");
    expect(workspace).toContain('id="holder-todos"');
    expect(workspace).toContain('id="holder-alerts"');
  });

  it('provides task-specific imagery rather than using a profile photo as a banner', () => {
    const lessons = fs.readFileSync(path.resolve('lib/program-holder/task-lessons.ts'), 'utf8');
    expect(lessons).toContain("title: 'Training hours'");
    expect(lessons).toContain("title: 'Students'");
    expect(lessons).not.toContain('avatar_url');
    expect(workspace).not.toContain('4bc589d3-bd39-4a50-a724-73e50506c1f1');
  });

  it('does not force the HVAC image onto unrelated dashboards', () => {
    expect(workspace).not.toContain("'/images/trades/hero-program-hvac.jpg'");
    expect(workspace).not.toContain('isCarlinaBanner');
    expect(guard).toContain('avatar_url?: string | null');
  });

  it('scopes HVAC requirements and payout copy to the assigned program', () => {
    expect(workspace).toMatch(/\.\.\.\(isHvac\s*\?\s*\[\s*\{\s*label: 'HVAC program assignment'/);
    expect(payment).not.toContain('David must finish');
    expect(payment).not.toContain('HVAC training payment');
    expect(mou).not.toContain('INDY ON DEMAND SERVICES LLC');
    expect(mou).toContain("from('program_holder_programs')");
  });

  it('requires every roster row to belong to an assigned program and learner role', () => {
    expect(holderData).toContain(".in('program_id', programIds)");
    expect(holderData).toContain("import { isLearnerRosterProfile } from './roster-eligibility'");
    expect(holderData).toContain('.filter(isLearnerRosterProfile)');
    expect(holderData).toContain('eligibleRosterUserIds.has(row.user_id)');
    expect(holderData).not.toContain("'pending',\n        'applied'");
  });

  it('does not label shared dashboard tools as HVAC-only', () => {
    expect(callList).toContain('call every new applicant');
    expect(callList).not.toContain('HVAC applicants');
    expect(closeout).toContain('Practical program skills verified');
    expect(closeout).not.toContain('Practical HVAC skills verified');
  });
});
