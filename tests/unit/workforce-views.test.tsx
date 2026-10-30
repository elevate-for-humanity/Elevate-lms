import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const mocks = vi.hoisted(() => ({ workspace: vi.fn(), records: vi.fn() }));
vi.mock('@/lib/workforce/workspace', () => ({
  getWorkforceWorkspace: mocks.workspace,
  workforceRecords: mocks.records,
}));
import { WorkforceRoster } from '@/components/workforce/WorkforceRoster';
import { WorkforceOverview } from '@/components/workforce/WorkforceOverview';
import { GET } from '@/apps/lms/app/workforce/wioa-export/download/route';

const enrollment = (id: string, user: string, state: string, name = user) => ({
  id,
  user_id: user,
  enrollment_state: state,
  program_id: 'program1',
  profile: { full_name: name, email: `${user}@example.test` },
  program: { title: 'HVAC' },
});

describe('Workforce user-facing regressions', () => {
  it('finds a participant beyond the former first-100 search limit', async () => {
    const rows = Array.from({ length: 155 }, (_, i) =>
      enrollment(String(i), `person${i}`, 'active'),
    );
    mocks.workspace.mockResolvedValue({ enrollments: rows });
    const html = renderToStaticMarkup(await WorkforceRoster({ params: { q: 'person154' } }));
    expect(html).toContain('1 learners');
    expect(html).toContain('person154@example.test');
    expect(html).not.toContain('person153@example.test');
  });
  it('filters completed enrollments before grouping people', async () => {
    mocks.workspace.mockResolvedValue({
      enrollments: [
        enrollment('a', 'one', 'active'),
        enrollment('b', 'two', 'completed'),
        enrollment('c', 'two', 'completed'),
      ],
    });
    const html = renderToStaticMarkup(await WorkforceRoster({ params: { filter: 'completed' } }));
    expect(html).toContain('1 learners');
    expect(html).toContain('2 program records');
    expect(html).toContain('two@example.test');
    expect(html).not.toContain('one@example.test');
    expect(html).toContain('name="filter"');
    expect(html).toContain('value="completed"');
  });
  it('shows the same canonical participant and enrollment totals in admin oversight', async () => {
    mocks.workspace.mockResolvedValue({
      ctx: { global: true },
      userIds: ['one', 'two'],
      enrollments: [
        enrollment('a', 'one', 'active'),
        enrollment('b', 'two', 'completed'),
        enrollment('c', 'two', 'completed'),
      ],
    });
    mocks.records.mockResolvedValue([]);
    const html = renderToStaticMarkup(await WorkforceOverview({ admin: true }));
    expect(html).toContain('1 currently enrolled learner accounts');
    expect(html).toContain('https://app.elevateforhumanity.org/workforce/participants');
    expect(html).toMatch(/>2<\/p><p>Learners With Records/);
  });
  it('exports scoped rows with private cache headers and no inferred cross-program placement', async () => {
    mocks.workspace.mockResolvedValue({
      ctx: { global: false, tenantId: 'mine' },
      userIds: ['one'],
      enrollments: [
        enrollment('a', 'one', 'active', '=unsafe'),
        enrollment('b', 'one', 'completed'),
      ],
    });
    mocks.records.mockResolvedValue([
      {
        id: 'p1',
        enrollment_id: 'a',
        learner_id: 'one',
        tenant_id: 'mine',
        status: 'verified',
        employer_name: 'Employer A',
      },
      {
        id: 'p2',
        enrollment_id: 'b',
        learner_id: 'one',
        tenant_id: 'other',
        status: 'verified',
        employer_name: 'Other tenant',
      },
    ]);
    const response = await GET();
    const csv = await response.text();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(csv).toContain("'=unsafe");
    expect(csv.match(/Employer A/g)).toHaveLength(1);
    expect(csv).not.toContain('Other tenant');
    expect(csv.split('\r\n')).toHaveLength(3);
  });
});
