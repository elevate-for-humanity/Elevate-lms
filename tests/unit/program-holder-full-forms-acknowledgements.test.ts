import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  insert: vi.fn(async () => ({ error: null })), complete: vi.fn(), error: null as unknown,
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/lib/auth/require-program-holder', () => ({ requireProgramHolder: async () => ({ mode: 'holder', user: { id: 'holder-user', full_name: 'Holder Signer' }, holderId: 'holder-id', profile: { full_name: 'Holder Signer' }, db: {
  from: () => ({
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: mocks.error }) }) }) }),
    insert: mocks.insert,
  }),
} }) }));
vi.mock('@/lib/program-holder/onboarding-complete', () => ({ checkAndSendOnboardingCompleteEmail: mocks.complete }));
import { POST } from '@/apps/lms/app/api/program-holder/acknowledgements/route';
const post = (body: Record<string, boolean>) => POST(new Request('https://app.test/api', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }));
beforeEach(() => { vi.clearAllMocks(); mocks.error = null; });
it('records an NDA acknowledgement and marks it received', async () => {
  const response = await post({ nda: true });
  expect(response.status).toBe(200);
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ document_type: 'nda', full_name: 'Holder Signer' }));
});
it('records NDA and non-compete together even while full contract details are pending review', async () => {
  // Program holders do not pay, so no payment schedule gates these acknowledgements.
  // Previously a pending full-forms review rejected the whole batch with 409 and
  // recorded nothing — not even the handbook/rights acceptances in the same request —
  // which is why uploaded/accepted documents kept showing as outstanding.
  const response = await post({ nda: true, non_compete: true });
  expect(response.status).toBe(200);
  expect(mocks.insert).toHaveBeenCalledTimes(2);
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ document_type: 'nda' }));
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ document_type: 'non_compete' }));
});
it('records only the requested acknowledgements and skips the rest', async () => {
  await post({ handbook: true });
  expect(mocks.insert).toHaveBeenCalledTimes(1);
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ document_type: 'handbook' }));
});
it('rejects requests without any acknowledgement checked', async () => {
  expect((await post({})).status).toBe(400);
});
it('fails closed when the acknowledgement lookup fails', async () => {
  mocks.error = { message: 'database unavailable' };
  const response = await post({ nda: true });
  expect(response.status).toBe(503);
  expect(mocks.insert).not.toHaveBeenCalled();
});
