// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ create: vi.fn(), admin: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.create }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/logging/auditLog', () => ({ auditLog: mocks.audit, AuditAction: { CASE_UPDATED: 'updated' }, AuditEntity: { APPLICATION: 'application' } }));
import { POST } from '@/apps/admin/app/api/admin/review-queue/resolve/route';

function setup(status = 'completed', mutationError: unknown = null) {
 const update = vi.fn(); const filters: unknown[][] = []; const queueWrites = vi.fn();
 const requestDb = { auth: { getUser: async () => ({ data: { user: { id: 'actor' } } }) }, from: (table: string) => {
  const q = { select: () => q, eq: () => q, insert: async () => ({ error: null }), update: (value: unknown) => { queueWrites(table, value); return q; },
   maybeSingle: async () => ({ data: table === 'profiles' ? { role: 'admin' } : table === 'review_queue' ? { queue_type: 'document_review', entity_type: 'enrollment_requirement', subject_id: 'requirement', subject_type: 'document' } : { id: 'requirement', status, enrollment_id: 'enrollment' }, error: null }),
   then: (resolve: (value: unknown) => unknown) => resolve({ error: null }) }; return q;
 }};
 mocks.create.mockResolvedValue(requestDb);
 mocks.admin.mockResolvedValue({ from: () => {
  const q = { update: (value: unknown) => { update(value); return q; }, eq: (...args: unknown[]) => { filters.push(args); return q; }, select: () => q,
   maybeSingle: async () => ({ data: mutationError ? null : { id: 'requirement' }, error: mutationError }) }; return q;
 }});
 return { update, filters, queueWrites };
}
const request = () => new Request('https://admin.example/api/admin/review-queue/resolve', { method: 'POST', body: JSON.stringify({ queue_item_id: 'queue', action: 'approve' }) });
beforeEach(() => { vi.clearAllMocks(); });
describe('live enrollment document verification contract', () => {
 it('writes the verified actor and supported timestamp while preserving the conditional update', async () => {
  const { update, filters } = setup();
  expect((await POST(request())).status).toBe(200);
  expect(update).toHaveBeenCalledWith({ status: 'verified', verified_by: 'actor', updated_at: expect.any(String) });
  expect(filters).toContainEqual(['id', 'requirement']); expect(filters).toContainEqual(['status', 'completed']);
  expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'actor' }));
 });
 it('does not verify a document that was not submitted', async () => {
  const { update } = setup('pending'); expect((await POST(request())).status).toBe(409); expect(update).not.toHaveBeenCalled();
 });
 it('does not resolve the review queue after a failed verification write', async () => {
  const { queueWrites } = setup('completed', { message: 'write failed' });
  expect((await POST(request())).status).toBe(500); expect(queueWrites).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
 });
});
