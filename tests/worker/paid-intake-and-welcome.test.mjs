import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresSelfPayProgramPayment, paidInvoiceMatchesProgram } from '../../lib/programs/paid-intake-policy.mjs';
import { queueApprenticeshipWelcome, queuePaidProgramWelcome } from '../../lib/enrollment/apprenticeship-welcome.ts';
const regular={id:'p',slug:'hvac-technician',is_free:false};
const apprentice={id:'b',slug:'barber-apprenticeship',is_apprenticeship:true};
const invoice=(program)=>({status:'paid',total_cents:60000,customer_email:'student@example.invalid',fulfillment_type:'program_enrollment',fulfillment_payload:{program_id:program.id,program_slug:program.slug}});
test('every paid regular/apprenticeship program requires payment; no four-slug bypass',()=>{
 assert.equal(requiresSelfPayProgramPayment(regular,''),true);
 assert.equal(requiresSelfPayProgramPayment({...regular,slug:'new-paid-program'},'self_pay'),true);
 assert.equal(requiresSelfPayProgramPayment(apprentice,'wioa'),true);
 assert.equal(requiresSelfPayProgramPayment(regular,'wioa'),false);
 assert.equal(requiresSelfPayProgramPayment({...regular,is_free:true},''),false);
 assert.throws(()=>requiresSelfPayProgramPayment(null,''),/metadata/);
});
test('paid invoice must match exact applicant and program with positive verified amount',()=>{
 for(const program of [regular,apprentice]){
  const paid=invoice(program);
  assert.equal(paidInvoiceMatchesProgram(paid,program,' STUDENT@example.invalid '),true);
  for(const changed of [
   {status:'open'},{total_cents:0},{customer_email:'other@example.invalid'},
   {fulfillment_payload:{}},{fulfillment_payload:{program_id:'other'}},
   {fulfillment_payload:{program_id:program.id,program_slug:'other'}},
   {fulfillment_type:'tuition'}
  ]) assert.equal(paidInvoiceMatchesProgram({...paid,...changed},program,'student@example.invalid'),false);
 }
 assert.equal(paidInvoiceMatchesProgram({...invoice(apprentice),fulfillment_type:'apprenticeship_deposit'},apprentice,'student@example.invalid'),true);
 assert.equal(paidInvoiceMatchesProgram({...invoice(regular),fulfillment_type:'apprenticeship_deposit'},regular,'student@example.invalid'),false);
});
function fixture(apprenticeship,{status='active',paid='paid',legacy=false,queueError=false}={}){
 const rows=new Map(), writes=[];
 const db={from(table){const filters={}; const q={
  select(){return q},eq(k,v){filters[k]=v;return q},
  async maybeSingle(){return {error:null,data:
   table==='program_enrollments'?{id:'e',student_id:'u',program_id:'p',program_slug:apprenticeship?'barber-apprenticeship':'hvac-technician',status,payment_status:paid}:
   table==='profiles'?{email:'student@example.invalid',full_name:'Test learner'}:
   table==='programs'?{title:'Program',is_apprenticeship:apprenticeship}:
   legacy?{id:'old-welcome'}:null}},
  async upsert(row,options){writes.push({row,options});if(queueError)return {error:{code:'test'}};if(!rows.has(row.notification_key))rows.set(row.notification_key,row);return {error:null}}
 };return q}};
 return {db,rows,writes};
}
test('deposit and regular fulfillment share one welcome key and correct dashboard',async()=>{
 for(const apprentice of [true,false]){
  const f=fixture(apprentice);
  await queuePaidProgramWelcome(f.db,'e');
  if(apprentice)await queueApprenticeshipWelcome(f.db,{enrollmentId:'e',email:'ignored@example.invalid',name:'Ignored',programName:'Ignored'});
  await queuePaidProgramWelcome(f.db,'e');
  assert.equal(f.rows.size,1);
  assert.equal([...f.rows.values()][0].template_data.dashboard_url,'https://app.elevateforhumanity.org/'+(apprentice?'apprentice':'learner/dashboard'));
  assert.deepEqual(f.writes[0].options,{onConflict:'notification_key',ignoreDuplicates:true});
 }
});
test('legacy welcome is preserved; unpaid, inactive and failed outbox do not claim success',async()=>{
 const legacy=fixture(true,{legacy:true});await queuePaidProgramWelcome(legacy.db,'e');assert.equal(legacy.writes.length,0);
 for(const options of [{status:'pending'},{paid:'pending'},{queueError:true}]){
  const f=fixture(true,options);await assert.rejects(queuePaidProgramWelcome(f.db,'e'));
 }
});
