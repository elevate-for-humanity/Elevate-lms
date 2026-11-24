import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  record: vi.fn(),
  update: vi.fn(),
  savedHolder: vi.fn(),
  error: null as unknown,
  holder: { features: { full_forms_status: 'review_pending' } } as any,
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'holder-user', email: 'holder@example.test' } } }) },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: 'program_holder', program_holder_id: 'holder-id' } }) }) }) }),
}) }));
vi.mock('@/lib/auth/require-program-holder', () => ({ requireProgramHolder: async () => ({ mode: 'holder', user: { id: 'holder-user' }, holderId: 'holder-id', db: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.holder, error: mocks.error }) }) }) }),
} }) }));
vi.mock('@/lib/legal/recordAgreementAcceptance', () => ({ recordAgreementAcceptance: mocks.record }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => ({
      update: (values: unknown) => ({
        eq: (field: string, id: string) => ({
          select: (columns: string) => ({
            maybeSingle: () => {
              mocks.update(values, field, id, columns);
              return mocks.savedHolder();
            },
          }),
        }),
      }),
    }),
  }),
}));
vi.mock('@/lib/program-holder/onboarding-complete', () => ({ checkAndSendOnboardingCompleteEmail: vi.fn() }));
import { signAgreement } from '@/apps/marketing/app/actions/sign-agreement';
import { paymentAddendum } from '@/lib/program-holder/payment-addendum';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.error = null;
  mocks.holder = { features: { full_forms_status: 'review_pending' } };
  mocks.savedHolder.mockResolvedValue({ data: { id: 'holder-id' }, error: null });
});
it.each(['checkbox','typed','drawn'] as const)('records %s MOU acceptance even while full contract details are pending review', async method => {
  // Program holders do not pay: there is no payment schedule for a program holder,
  // and Schedule A payment terms are completed as part of the signed agreement,
  // not a precondition to signing. A pending full-forms review must not block
  // the MOU signature.
  mocks.record.mockResolvedValue({ success: true, id: 'mou-acceptance' });
  const result = await signAgreement({ agreementType: 'program_holder_mou', agreementVersion: '3.0-holder-id', method, typedName: 'Holder Signer' });
  expect(result).toMatchObject({ success: true, id: 'mou-acceptance' });
  expect(mocks.record).toHaveBeenCalledWith(expect.objectContaining({
    documentVersion: '3.0-holder-id', userId: 'holder-user', signatureMethod: method,
  }));
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({ mou_signed: true, mou_status: 'signed', status: 'active' }),
    'id', 'holder-id', 'id',
  );
});
it('does not report successful activation if no holder row was updated', async () => {
  mocks.record.mockResolvedValue({ success: true, id: 'mou-acceptance' });
  mocks.savedHolder.mockResolvedValue({ data: null, error: null });
  const result = await signAgreement({
    agreementType: 'program_holder_mou', agreementVersion: '3.0-holder-id', method: 'typed', typedName: 'Holder Signer',
  });
  expect(result).toMatchObject({ success: false });
  expect(mocks.record).toHaveBeenCalledOnce();
  expect(mocks.update).toHaveBeenCalledOnce();
});
it('fails closed if agreement readiness cannot be read', async () => {
  mocks.error = { message: 'database unavailable' }; mocks.holder = null;
  const result = await signAgreement({ agreementType: 'program_holder_mou', agreementVersion: '3.0-holder-id', method: 'typed' });
  expect(result).toMatchObject({ success: false }); expect(mocks.record).not.toHaveBeenCalled();
});
it('records a fresh payment acceptance without replacing the original MOU or activating payouts', async () => {
  mocks.holder = { features: { payment_addendum: { title: 'Payment', total_cents: 120000, start_cents: 60000,
    completion_cents: 60000, paragraphs: ['Payment terms'], checklist: ['Verified completion'] } } };
  mocks.record.mockResolvedValue({ success: true, id: 'new-acceptance' });
  const version = paymentAddendum(mocks.holder.features, 'holder-id')!.version;
  expect(await signAgreement({ agreementType: 'program_holder_mou', agreementVersion: version, method: 'typed', typedName: 'Holder Signer' })).toMatchObject({ success: true });
  expect(mocks.record).toHaveBeenCalledWith(expect.objectContaining({ documentVersion: version, userId: 'holder-user' }));
  expect(mocks.update).not.toHaveBeenCalled();
});
it('rejects an addendum signature for stale terms', async () => {
  mocks.holder = { features: {} };
  expect(await signAgreement({ agreementType: 'program_holder_mou', agreementVersion: 'payment-addendum-old', method: 'typed' })).toMatchObject({ success: false });
  expect(mocks.record).not.toHaveBeenCalled();
});
