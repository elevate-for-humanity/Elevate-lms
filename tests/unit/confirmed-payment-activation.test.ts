import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({existing:null as any,writes:[] as any[]}));
vi.mock('@/lib/audit-context',()=>({setAuditContext:async()=>{}}));
vi.mock('@/lib/audit',()=>({logAuditEvent:async()=>{}}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let mutation:any;const q:any={select:()=>q,eq:()=>q,update:(v:any)=>{mutation=v;h.writes.push({table,v});return q;},insert:(v:any)=>{mutation=v;h.writes.push({table,v});return q;},maybeSingle:async()=>({data:table==='program_enrollments'?(mutation?{id:'enrollment'}:h.existing):{name:'Nails'},error:null}),then:(resolve:any)=>Promise.resolve(resolve({data:null,error:null}))};return q;
}})}));
import {createEnrollmentFromPayment} from '@/lib/enrollment/create-enrollment';
beforeEach(()=>{h.existing=null;h.writes=[];vi.stubGlobal('fetch',vi.fn(async()=>new Response('{}')));});
const input={studentId:'learner',programId:'program',programSlug:'nail-technician-apprenticeship',email:'fixture@example.invalid',paymentProvider:'affirm' as const,paymentReference:'captured-fixture',paymentAmountCents:100000};
it('records confirmed payment as pending administrator approval without granting access',async()=>{
 expect(await createEnrollmentFromPayment(input)).toMatchObject({success:true,isNewEnrollment:true});
 expect(h.writes.find(x=>x.table==='program_enrollments').v).toMatchObject({status:'pending',payment_status:'paid',access_granted_at:null,access_status:'pending',next_required_action:'ADMIN_APPROVAL_REQUIRED'});
});
it('preserves pending approval for an existing enrollment even when payment arrives',async()=>{
 h.existing={id:'existing',status:'pending_review'};
 expect(await createEnrollmentFromPayment(input)).toMatchObject({success:true,enrollmentId:'existing'});
 expect(h.writes.find(x=>x.table==='program_enrollments').v.status).toBe('pending');
});
it('refuses to restore a revoked enrollment on a payment callback',async()=>{
 h.existing={id:'revoked',status:'revoked',revoked_at:'2026-11-18T00:00:00Z'};
 expect(await createEnrollmentFromPayment(input)).toMatchObject({success:false});
 expect(h.writes).toEqual([]);
});
it('does not recreate or resend welcome for an already active enrollment',async()=>{
 h.existing={id:'existing',status:'active'};
 expect(await createEnrollmentFromPayment(input)).toMatchObject({success:true,isNewEnrollment:false});
 expect(h.writes).toEqual([]);expect(fetch).not.toHaveBeenCalled();
});
