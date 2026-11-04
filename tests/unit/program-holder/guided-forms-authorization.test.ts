import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  mode: 'holder',
  fail: '',
  queries: [] as { table: string; column: string; value: unknown }[],
  writes: [] as string[],
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/auth/require-program-holder', () => ({
  requireProgramHolder: async () => ({
    mode: state.mode,
    holderId: 'holder-a',
    programIds: ['program-a'],
    user: { id: 'user-a' },
    profile: { full_name: 'Partner A', role: 'program_holder' },
    db: {
      from: (table: string) => {
        const records: Record<string, unknown> = {
          program_holders: {
            organization_name: 'Partner A',
            features: {},
            mou_signed: true,
            mou_status: 'signed',
          },
          program_enrollments: [
            { id: 'enrollment-a', full_name: 'Assigned Student', program_id: 'program-a' },
            { id: 'enrollment-b', full_name: 'Other Program Student', program_id: 'program-b' },
          ],
          payout_schedules: [],
          program_holder_payout_transactions: [],
          onboarding_video_assignments: {
            id: 'video-a',
            watch_seconds: 0,
            updated_at: new Date().toISOString(),
          },
        };
        const result = () => ({
          data: records[table],
          error: state.fail === table ? { message: 'Unavailable' } : null,
        });
        const q: any = {};
        q.select = q.is = q.in = () => q;
        q.eq = (column: string, value: unknown) => {
          state.queries.push({ table, column, value });
          return q;
        };
        q.single = q.maybeSingle = async () => result();
        q.insert =
          q.update =
          q.upsert =
            () => {
              state.writes.push(table);
              return q;
            };
        q.then = (resolve: any, reject: any) => Promise.resolve(result()).then(resolve, reject);
        return q;
      },
    },
  }),
}));
import { GET as invoiceOptions } from '../../../apps/lms/app/api/program-holder/invoice-options/route';
import { POST as saveW9 } from '../../../apps/lms/app/api/program-holder/forms/w9/route';
import { POST as orientation } from '../../../apps/lms/app/api/program-holder/orientation/route';
const request = (body: unknown) =>
  new NextRequest('https://example.test/api/partner', {
    method: 'POST',
    body: JSON.stringify(body),
  });
beforeEach(() => {
  state.mode = 'holder';
  state.fail = '';
  state.queries = [];
  state.writes = [];
});
it('does not permit administrator preview to sign tax or video acknowledgements', async () => {
  state.mode = 'preview';
  expect((await invoiceOptions()).status).toBe(403);
  expect((await saveW9(request({}))).status).toBe(403);
  expect((await orientation(request({ action: 'acknowledge' }))).status).toBe(403);
  expect(state.writes).toEqual([]);
});
it('scopes student and financial queries to the signed-in holder and assigned programs', async () => {
  const response = await invoiceOptions();
  expect(response.status).toBe(200);
  expect((await response.json()).students.map((s: any) => s.id)).toEqual(['enrollment-a']);
  for (const table of [
    'program_enrollments',
    'payout_schedules',
    'program_holder_payout_transactions',
  ])
    expect(state.queries).toContainEqual({ table, column: 'program_holder_id', value: 'holder-a' });
});
it('fails closed when financial records cannot load', async () => {
  state.fail = 'payout_schedules';
  expect((await invoiceOptions()).status).toBe(503);
});
it('rejects video sign-off before playback without inserting a signature', async () => {
  expect(
    (
      await orientation(
        request({
          action: 'acknowledge',
          signer: 'Partner A',
          understood: true,
          agreementAnswer: 'individual',
          bankAnswer: 'provider',
          paymentAnswer: 'review',
        }),
      )
    ).status,
  ).toBe(400);
  expect(state.writes).toEqual([]);
});
it('rejects invalid W-9 data before touching protected storage', async () => {
  const response = await saveW9(request({ tin: '123', certified: false }));
  expect(response.status).toBe(400);
  expect(await response.text()).not.toContain('123');
  expect(state.writes).toEqual([]);
});
