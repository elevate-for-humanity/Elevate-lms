import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ record: vi.fn(), error: null as unknown, holder: { features: { full_forms_status: 'review_pending' } } as any }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'holder-user', email: 'holder@example.test' } } }) },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: 'program_holder', program_holder_id: 'holder-id' } }) }) }) }),
}) }));
vi.mock('@/lib/auth/require-program-holder', () => ({ requireProgramHolder: async () => ({ mode: 'holder', user: { id: 'holder-user' }, holderId: 'holder-id', db: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.holder, error: mocks.error }) }) }) }),
} }) }));
vi.mock('@/lib/legal/recordAgreementAcceptance', () => ({ recordAgreementAcceptance: mocks.record }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
vi.mock('@/lib/program-holder/onboarding-complete', () => ({ checkAndSendOnboardingCompleteEmail: vi.fn() }));
import { signAgreement } from '@/apps/marketing/app/actions/sign-agreement';
beforeEach(() => { vi.clearAllMocks(); mocks.error = null; mocks.holder = { features: { full_forms_status: 'review_pending' } }; });
it.each(['checkbox','typed','drawn'] as const)('blocks %s acceptance while full contract details are incomplete', async method => {
  const result = await signAgreement({ agreementType: 'program_holder_mou', agreementVersion: '3.0-holder-id', method, typedName: 'Holder Signer' });
  expect(result).toMatchObject({ success: false, error: expect.stringContaining('payment terms') });
  expect(mocks.record).not.toHaveBeenCalled();
});
it('fails closed if agreement readiness cannot be read', async () => {
  mocks.error = { message: 'database unavailable' }; mocks.holder = null;
  const result = await signAgreement({ agreementType: 'program_holder_mou', agreementVersion: '3.0-holder-id', method: 'typed' });
  expect(result).toMatchObject({ success: false }); expect(mocks.record).not.toHaveBeenCalled();
});
