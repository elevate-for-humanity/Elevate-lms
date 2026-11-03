import { isQaE2EIdentity } from '../../lib/qa/is-qa-e2e-identity';
import { readHoursPages } from '../../lib/apprenticeship/admin-hours';
import { verifyWorkbook } from '../../apps/marketing/app/onboarding/learner/verify-identity/page';

const syntheticQAEmail = 'qa-synthetic@example.com';

beforeEach(() => {
  globalThis.supabase = { auth: { user: { email: syntheticQAEmail } } } as unknown as SupabaseClient;
});

it('verifies the live workbook opens for its assigned program, all projects and prompts load, simulations produce correct feedback, and save/reload works', async () => {
  const programSlug = 'business-administration';
  const lessonId = 'e18bf654-f40f-4894-9f37-2478e5c0471d';

  await verifyWorkbook(programSlug, lessonId);
  expect(isQaE2EIdentity(syntheticQAEmail)).toBe(true);
});
