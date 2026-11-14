import { describe, it, expect } from 'vitest';
import { completionInvoiceDraft } from '../../lib/program-holder/completion-invoice';
import { validateTestingReport } from '../../lib/program-holder/testing-report';
const schedule = { id:'s',total_payout_cents:200000,increment_1_cents:80000,increment_1_status:'paid',increment_2_cents:120000,increment_2_status:'pending' };
describe('Individual completion invoice draft', () => {
 it('uses the individual schedule rather than a universal amount', () => expect(completionInvoiceDraft(schedule,[], 'r').amount_cents).toBe(120000));
 it('does not invent missing terms', () => expect(completionInvoiceDraft(null,[], 'r').amount_cents).toBeNull());
 it('does not charge an immediate full-payment exception twice', () => expect(completionInvoiceDraft({...schedule,increment_1_cents:200000,increment_2_cents:0},[], 'r').status).toBe('not_due'));
 it('deducts previously paid second installments', () => expect(completionInvoiceDraft(schedule,[{installment:2,amount_cents:20000,status:'paid'}], 'r').amount_cents).toBe(100000));
 it('holds while a payment is processing', () => expect(completionInvoiceDraft(schedule,[{installment:2,status:'processing'}], 'r').status).toBe('payment_in_progress'));
 it('does not recreate an already paid invoice', () => expect(completionInvoiceDraft({...schedule,increment_2_status:'paid'},[], 'r').amount_cents).toBe(0));
});
describe('Exit report validation', () => {
 const valid={start:'2026-10-01',end:'2026-10-28',hours:24,exam:'Exam A',coursework:'Completed coursework',assessments:'Quiz: 90 percent',practical_skills:'Demonstrated competencies',summary:'Completed training',certified:true,evidenceIds:['11111111-1111-4111-8111-111111111111']};
 it('accepts actual hours without imposing another program’s hours',()=>expect(validateTestingReport(valid,'2026-10-28')).toBeNull());
 it('requires evidence',()=>expect(validateTestingReport({...valid,evidenceIds:[]},'2026-10-28')).not.toBeNull());
 it('rejects impossible and future dates',()=>{expect(validateTestingReport({...valid,start:'2026-02-30'},'2026-10-28')).not.toBeNull();expect(validateTestingReport({...valid,end:'2026-10-29'},'2026-10-28')).not.toBeNull();});
 it('requires instructor certification',()=>expect(validateTestingReport({...valid,certified:false},'2026-10-28')).not.toBeNull());
});
