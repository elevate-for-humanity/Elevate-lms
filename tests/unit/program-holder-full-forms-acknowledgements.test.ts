import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  insert: vi.fn(), complete: vi.fn(), error: null as unknown,
  holder: { features: { full_forms_status: 'review_pending' } } as any,
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/lib/auth/require-program-holder', () => ({ requireProgramHolder: async () => ({
  mode: 'holder', holderId: 'achieve', user: { id: 'holder-user' }, profile: { full_name: 'Holder' }, db: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.holder, error: mocks.error }) }) }),
      insert: mocks.insert,
    }),
  },
}) }));
vi.mock('@/lib/program-holder/onboarding-complete', () => ({ checkAndSendOnboardingCompleteEmail: mocks.complete }));
import { POST } from '@/apps/lms/app/api/program-holder/acknowledgements/route';
beforeEach(() => { vi.clearAllMocks(); mocks.error = null; mocks.holder = { features: { full_forms_status: 'review_pending' } }; });
it.each([{ nda: true }, { non_compete: true }, { handbook: true, rights: true, nda: true, non_compete: true }])('rejects legacy acceptance without partial writes: %j', async body => {
  const response = await POST(new Request('https://example.test/api/program-holder/acknowledgements', { method: 'POST', body: JSON.stringify(body) }));
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ reviewUrl: '/program-holder/agreements' });
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.complete).not.toHaveBeenCalled();
});
it('fails closed when readiness cannot be loaded', async () => {
  mocks.error = { message: 'unavailable' }; mocks.holder = null;
  const response = await POST(new Request('https://example.test/api/program-holder/acknowledgements', { method: 'POST', body: JSON.stringify({ nda: true }) }));
  expect(response.status).toBe(503); expect(mocks.insert).not.toHaveBeenCalled();
});
