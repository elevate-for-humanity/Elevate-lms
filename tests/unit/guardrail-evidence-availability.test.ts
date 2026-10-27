import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ failed: '', writes: vi.fn(), email: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: state.email }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => {
  const q: any = { select: () => q, eq: () => q, not: () => q, gte: () => q, insert: state.writes, update: state.writes,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === 'program_holders' ? [{ id: 'holder', name: 'Partner', status: 'active' }] : [], count: 0, error: state.failed === table ? { message: 'Unavailable' } : null }).then(resolve),
  }; return q;
} }) }));
import { runGuardrailEvaluation } from '@/lib/governance/guardrail-engine';
beforeEach(() => { state.failed = ''; state.writes.mockClear(); state.email.mockClear(); });
it('reports unconfigured metrics instead of substituting perfect scores or enforcing missing evidence', async () => {
  const result = await runGuardrailEvaluation({ dryRun: true });
  expect(result.errors.some(error => error.includes('no configured evidence source'))).toBe(true);
  expect(result.violations).toEqual([]);
  expect(state.writes).not.toHaveBeenCalled();
  expect(state.email).not.toHaveBeenCalled();
});
it('does not treat a failed evidence read as zero recorded violations', async () => {
  state.failed = 'compliance_violations';
  const result = await runGuardrailEvaluation({ dryRun: true, severity: 'critical' });
  expect(result.errors.some(error => error.includes('unavailable'))).toBe(true);
  expect(state.writes).not.toHaveBeenCalled();
});
it('does not claim that zero partners were evaluated when the partner lookup failed', async () => {
  state.failed = 'program_holders';
  await expect(runGuardrailEvaluation({ dryRun: true })).rejects.toThrow('could not be loaded');
});
