import {expect,it} from 'vitest';
import {queuePaidProgramWelcome} from '@/lib/enrollment/apprenticeship-welcome';
function fixture(apprentice:boolean,status='active',fail=false) {
 const mail:any[]=[];
 const db={from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({error:null,data:table==='program_enrollments'?{id:'e',student_id:'u',program_id:'p',status,payment_status:'paid'}:table==='profiles'?{email:'learner@example.invalid',full_name:'Learner'}:{title:'Program',is_apprenticeship:apprentice}}),upsert:async(row:any,opts:any)=>{mail.push({row,opts});return {error:fail?{}:null};}};return q;}};
 return {db,mail};
}
it.each([true,false])('queues dashboard welcome for paid program, apprenticeship=%s',async apprentice=>{
 const {db,mail}=fixture(apprentice);await queuePaidProgramWelcome(db,'e');await queuePaidProgramWelcome(db,'e');
 expect(mail[0].row.notification_key).toBe(mail[1].row.notification_key);
 expect(mail[0].opts).toEqual({onConflict:'notification_key',ignoreDuplicates:true});
 expect(mail[0].row.template_data.dashboard_url).toContain(apprentice?'/apprentice':'/learner/dashboard');
});
it('does not welcome an inactive enrollment',async()=>{
 const {db,mail}=fixture(true,'pending');await expect(queuePaidProgramWelcome(db,'e')).rejects.toThrow('Active paid');expect(mail).toEqual([]);
});
it('propagates queue errors for fulfillment retry',async()=>{
 const {db}=fixture(false,'active',true);await expect(queuePaidProgramWelcome(db,'e')).rejects.toThrow('could not be queued');
});
