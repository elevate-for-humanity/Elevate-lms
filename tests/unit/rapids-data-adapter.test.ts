import {expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({rows:[] as unknown[],error:null as Error|null}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/security/ssn-helper',()=>({decryptSSN:()=> '111223333',formatSSN:()=> '111-22-3333'}));
vi.mock('@/lib/apprenticeship/runtime-context',()=>({resolveApprenticeshipRuntimeContext:async()=>({contract:{sponsor:{registrationNumber:'recorded-program',legalName:'Recorded sponsor'},standard:{rapidsCode:'recorded-occupation',occupationTitle:'Recorded occupation'},completion:{fixedOjlCompletionHours:null}}})}));
vi.mock('@/lib/apprenticeship/progress-service',()=>({loadRegisteredApprenticeshipProgress:async()=>({ojl:{approvedHours:42},rti:{verifiedHours:12}})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let state='';const q={select:()=>q,in:async()=>({data:h.rows,error:h.error}),eq:(_field:string,value:string)=>{state=value;return q;},not:()=>q,order:()=>q,limit:()=>q,maybeSingle:async()=>({data:{submission_date:'2026-11-01'},error:h.error}),then:(resolve:(value:unknown)=>unknown)=>resolve({count:table==='rapids_submissions'?2:state==='active'?3:state==='completed'?1:state==='cancelled'?1:5,error:h.error})};return q;
}})}));
import {prepareRAPIDSData,generateRAPIDSReport} from '@/lib/compliance/rapids-integration';
it('prepares enrolled apprentices from stored identity and canonical registered progress',async()=>{
 h.rows=[{enrollment_id:'enrollment',first_name:'Test',last_name:'Apprentice',ssn_encrypted:'encrypted',gender:'X',date_of_birth:'1990-01-01',veteran_status:false,wage_at_entry:'12',current_wage:'14',registration_date:'2026-01-01',employer_name:'Recorded employer',employer_fein:'11-1111111'}];
 expect(await prepareRAPIDSData(['enrollment'])).toMatchObject([{program_number:'recorded-program',sponsor_name:'Recorded sponsor',hours_completed:42,hours_required:null,related_instruction_hours:12,wage_at_entry:12,current_wage:14}]);
});
it('does not invent missing identity records or zero counts during database failures',async()=>{
 h.rows=[];await expect(prepareRAPIDSData(['enrollment'])).rejects.toThrow('RAPIDS_APPRENTICE_RECORDS_MISSING');
 h.error=new Error('database offline');
 await expect(generateRAPIDSReport()).rejects.toThrow('database offline');h.error=null;
});
it('computes registry totals from exact database counts and confirmed submission dates',async()=>{
 expect(await generateRAPIDSReport()).toMatchObject({total_apprentices:5,active_apprentices:3,completed_apprentices:1,cancelled_apprentices:1,pending_submissions:2,average_completion_rate:'20.0%',last_submission_date:'2026-11-01',next_submission_due:null});
});
