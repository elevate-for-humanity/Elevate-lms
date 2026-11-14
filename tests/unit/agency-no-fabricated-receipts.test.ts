vi.mock('server-only',()=>({}));
vi.mock('@/lib/apprenticeship/runtime-context',()=>({resolveApprenticeshipRuntimeContext:vi.fn()}));
vi.mock('@/lib/apprenticeship/progress-service',()=>({loadRegisteredApprenticeshipProgress:vi.fn()}));
import { expect, it, vi } from 'vitest';
vi.mock('@/lib/logger', () => ({ logger: {info: vi.fn(),error:vi.fn()} }));
vi.mock('@/lib/supabase/admin', () => ({requireAdminClient: vi.fn(async () => { throw new Error('database unavailable'); })}));
vi.mock('@/lib/audit-context', () => ({setAuditContext: vi.fn()}));
vi.mock('@/lib/compliance/data-governance', () => ({assertNoAutoSubmit: vi.fn()}));
import { prepareRAPIDSData, submitToRAPIDS, updateRAPIDSProgress, reportRAPIDSCompletion, reportRAPIDSCancellation, generateRAPIDSReport } from '@/lib/compliance/rapids-integration';
import { submitUI3Request } from '@/lib/compliance/ui3-integration';
it('does not invent agency submission receipts or an empty compliance report', async () => {
  await expect(prepareRAPIDSData(['enrollment'])).rejects.toThrow('database unavailable');
  await expect(submitToRAPIDS([])).rejects.toThrow('RAPIDS_SUBMISSION_UNAVAILABLE');
  await expect(generateRAPIDSReport()).rejects.toThrow('database unavailable');
  await expect(submitUI3Request([])).rejects.toThrow('UI3_SUBMISSION_UNAVAILABLE');
});
it('does not mark progress, completion, or cancellation successful without an agency call', async () => {
  expect(await updateRAPIDSProgress('apprentice', 1, 1)).toMatchObject({success: false});
  expect(await reportRAPIDSCompletion('apprentice', '2026-11-07', 20)).toMatchObject({success: false});
  expect(await reportRAPIDSCancellation('apprentice', '2026-11-07', 'withdrawn')).toMatchObject({success: false});
});
