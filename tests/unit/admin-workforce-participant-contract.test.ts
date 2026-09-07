import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';

const list = readFileSync('apps/admin/app/workforce/participants/page.tsx', 'utf8');
const create = readFileSync('apps/admin/app/workforce/participants/new/page.tsx', 'utf8');

describe('Admin workforce participant contract', () => {
  it('uses canonical participant columns without fabricated defaults', () => {
    expect(list).toContain('participant.name');
    expect(list).toContain('participant.program_id');
    expect(list).toContain('participant.enrollment_date');
    expect(list).not.toContain('participant.full_name');
    expect(list).not.toContain("participant.program || 'WIOA'");
    expect(list).not.toContain("participant.status || 'active'");
    expect(list).not.toContain('participant.progress');
  });
  it('has an audited create action and a real detail route', () => {
    expect(create).toContain('action={createWorkforceParticipant}');
    expect(create).toContain("from('programs')");
    const action = readFileSync('apps/admin/app/workforce/participants/actions.ts', 'utf8');
    expect(action).toContain("table: 'workforce_participants'");
    expect(action).toContain("eq('is_active', true)");
    expect(action).toContain("['admin', 'staff', 'advisor']");
    expect(existsSync('apps/admin/app/workforce/participants/[id]/page.tsx')).toBe(true);
  });
});
