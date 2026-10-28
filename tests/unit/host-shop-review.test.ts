// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { hostShopReadyForReview } from '@/lib/partners/host-shop-review';
const mocks = vi.hoisted(() => ({ partnerId: 'shop', boardPartnerId: 'shop', missing: false, saved: true, update: vi.fn(), notification: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: async () => ({}) }));
const partner = { id: 'shop', name: 'Fixture Shop', partner_application_id: 'application', phone: '3175550100', supervisor_name: 'Supervisor', supervisor_license_number: 'FIXTURE', compensation_model: 'hourly', workers_comp_status: 'covered', has_general_liability: true, can_supervise_and_verify: true, mou_signed: true };
vi.mock('@/lib/partners/current-host-shop', () => ({ requireCurrentHostShopPartner: async () => ({ user: { id: 'owner' }, partner: { ...partner, id: mocks.partnerId }, db: { from: (table: string) => {
 const q = { update: (data: unknown) => { mocks.update(table,data); return q; }, eq: () => q, select: () => q, maybeSingle: async () => ({ data: mocks.saved ? {id:'application'} : null, error:null }), insert: mocks.notification };return q;
} } }) }));
vi.mock('@/lib/partner/board', () => ({ getHostShopBoard: async () => ({ partner: { id: mocks.boardPartnerId }, requiredDocumentCount: 1, documentStatuses: [{ is_required: true, uploaded: !mocks.missing, status: mocks.missing ? 'missing' : 'pending' }] }) }));
import { submitHostShopForReview } from '@/apps/lms/app/host-shop/onboarding/actions';
beforeEach(() => { vi.clearAllMocks();mocks.partnerId='shop';mocks.boardPartnerId='shop';mocks.missing=false;mocks.saved=true;mocks.notification.mockResolvedValue({error:null}); });
it('allows uploaded pending documents to enter review, without marking them accepted', () => {
 expect(hostShopReadyForReview(partner,{requiredDocumentCount:1,documentStatuses:[{is_required:true,uploaded:true,status:'pending'}]})).toBe(true);
 for (const status of ['missing','rejected','expired','correction_requested']) expect(hostShopReadyForReview(partner,{requiredDocumentCount:1,documentStatuses:[{is_required:true,uploaded:true,status}]})).toBe(false);
 expect(hostShopReadyForReview({...partner,mou_signed:false},{requiredDocumentCount:1,documentStatuses:[{is_required:true,uploaded:true,status:'pending'}]})).toBe(false);
});
it('moves only the linked drafted application into review and emits one staff alert', async () => {
 await expect(submitHostShopForReview()).rejects.toThrow('review=submitted');
 expect(mocks.update).toHaveBeenCalledWith('host_shop_applications',expect.objectContaining({status:'submitted',submitted_at:expect.any(String)}));
 expect(mocks.notification).toHaveBeenCalledTimes(1);
});
it('does not repeat the alert after the application has already left draft', async () => {
 mocks.saved=false;await expect(submitHostShopForReview()).rejects.toThrow('review=already-sent');expect(mocks.notification).not.toHaveBeenCalled();
});
it.each(['missing','scope'])('blocks %s prerequisites before writing', async (reason) => {
 if(reason==='missing')mocks.missing=true;else mocks.boardPartnerId='different-shop';
 await expect(submitHostShopForReview()).rejects.toThrow('review=incomplete');expect(mocks.update).not.toHaveBeenCalled();
});
