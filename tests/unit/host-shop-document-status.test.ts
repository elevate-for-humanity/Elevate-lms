import { describe, expect, it } from 'vitest';
import { hostShopStateAliases, resolveHostShopDocuments } from '@/lib/partners/host-shop-document-status';

const requirement = { document_type: 'extra_document', document_name: 'Extra', program_id: 'cosmetology', state: 'Indiana', is_required: true };
describe('shared Host Shop document readiness', () => {
  it('resolves IN and Indiana to the same requirements for existing and new shops', () => {
    expect(hostShopStateAliases('IN')).toEqual(expect.arrayContaining(['IN','Indiana','ALL']));
    expect(resolveHostShopDocuments('cosmetology','IN',[requirement],[])).toEqual(resolveHostShopDocuments('cosmetology','Indiana',[requirement],[]));
    expect(resolveHostShopDocuments('cosmetology','IN',[requirement],[]).find(r => r.document_type === 'extra_document')?.status).toBe('missing');
  });
  it('uses the latest submission and never resurrects an old acceptance', () => {
    const rows = resolveHostShopDocuments('cosmetology','IN',[],[
      { document_type:'salon_license',status:'approved',uploaded_at:'2026-01-01' },
      { document_type:'salon_license',status:'rejected',uploaded_at:'2026-02-01' },
    ]);
    expect(rows.find(r => r.document_type === 'salon_license')?.status).toBe('rejected');
  });
  it('rejects expired accepted evidence without changing stored approvals', () => {
    const doc = { document_type:'salon_license', status:'verified', expiration_date:'2026-10-29' };
    expect(resolveHostShopDocuments('cosmetology','IN',[],[doc],'2026-10-30').find(r => r.document_type === 'salon_license')?.status).toBe('expired');
    expect(doc.status).toBe('verified');
  });
  it('does not import requirements from another trade or state', () => {
    const rows=resolveHostShopDocuments('barber','IN',[requirement,{...requirement,program_id:'barber',state:'TX'}],[]);
    expect(rows.some(r => r.document_type === 'extra_document')).toBe(false);
  });
});
