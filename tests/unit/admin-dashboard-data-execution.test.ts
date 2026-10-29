import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
const state=vi.hoisted(()=>({rows:{} as Record<string,any[]>,fail:new Set<string>(),ranges:[] as string[],invoiceSnapshot:null as any,rpcCalls:[] as string[],authorize:vi.fn(),admin:vi.fn()}));
vi.mock('@/lib/auth/require-role',()=>({requireRole:state.authorize}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'admin'}}})}})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:state.admin}));
vi.mock('@/lib/admin/dashboard/get-system-health',()=>({getSystemHealth:async()=>({quickBooksWebhookOk:false,quickBooksBillingOk:false,buildEnvOk:true,staleJobs:0,degraded:false,missingDocuments:0,missingCertifications:0,unresolvedFlags:0,alerts:[]})}));
function database(){
 return {rpc:async(name:string)=>{state.rpcCalls.push(name);return {data:[state.invoiceSnapshot],error:state.fail.has('billing_invoices')?{message:'unavailable'}:null};},from(table:string){
  let start=0,end=Infinity,head=false,single=false;
  const query:any={select(_columns:string,options:any){head=options?.head===true;return query;},range(a:number,b:number){state.ranges.push(`${table}:${a}`);start=a;end=b;return query;},limit(n:number){end=n-1;return query;},maybeSingle(){single=true;return query;},then(resolve:any){return Promise.resolve({data:single?{full_name:'Admin',role:'admin'}:head?null:(state.rows[table]??[]).slice(start,end+1),count:(state.rows[table]??[]).length,error:state.fail.has(table)?{message:'database unavailable'}:null}).then(resolve);}};
  for(const method of ['eq','gt','gte','lt','in','like','ilike','not','order','abortSignal'])query[method]=()=>query;
  return query;
 }};
}
beforeEach(()=>{state.rows={};state.fail.clear();state.ranges=[];state.rpcCalls=[];state.invoiceSnapshot={all_time_cents:'0',this_month_cents:'0',paid_count:0,all_time_available:true,month_available:true};state.authorize.mockReset().mockResolvedValue({});state.admin.mockReset().mockResolvedValue(database());});
describe('executed admin dashboard data loader',()=>{
 it('isolates a missing paid-invoice date from otherwise available dashboard sources',async()=>{
  state.invoiceSnapshot={all_time_cents:'35000',this_month_cents:'0',paid_count:5,all_time_available:true,month_available:false};
  const data=await getAdminDashboardData();
  expect(data.degradedSections).toContain('paid_invoices');
  expect(data.degradedSections).not.toContain('dashboard_data');
  expect(data.revenueAllTimeCents).toBe(35000);
  expect(data.kpis.find(k=>k.label==='Paid Invoices This Month')?.unavailable).toBe(true);
 });
 it('keeps genuine source failures visible alongside invoice reconciliation',async()=>{
  state.invoiceSnapshot.month_available=false;
  state.fail.add('applications');
  const data=await getAdminDashboardData();
  expect(data.degradedSections).toContain('paid_invoices');
  expect(data.degradedSections).toContain('dashboard_data');
  expect(data.kpis.find(k=>k.label==='Pending Applications')?.unavailable).toBe(true);
 });
 it('uses the publication flag and excludes archived programs from the unpublished queue',async()=>{
  state.rows.programs=[
   {id:'live',title:'HVAC',status:'active',published:true,is_active:true},
   {id:'draft',title:'Business',status:'active',published:false,is_active:true},
   {id:'inactive-draft',title:'Accounting',status:'draft',published:false,is_active:false},
   {id:'archived',title:'Archived',status:'archived',published:false},
   {id:'archived-date',title:'Retired',status:'active',published:false,archived_at:'2026-10-01T00:00:00Z'},
  ];
  const data=await getAdminDashboardData();
  expect(data.blockedPrograms.map(row=>row.id)).toEqual(['draft','inactive-draft']);
 });
 it('excludes QA enrollments from operational counts, program totals and recent activity',async()=>{
  const today=new Date().toISOString();
  state.rows.program_enrollments=[
   {id:'real',user_id:'learner',full_name:'Real Learner',email:'learner@school.org',program_id:'program',status:'active',created_at:today},
   {id:'qa',user_id:'qa-user',full_name:'[QA E2E] Barber Apprentice',email:'barber@qa.invalid',program_id:'program',status:'active',created_at:today},
  ];
  state.rows.programs=[{id:'program',title:'Barber',published:true,status:'active'}];
  const data=await getAdminDashboardData();
  expect(data.counts.activeEnrollments).toBe(1);
  expect(data.operational.newEnrollmentsToday).toBe(1);
  expect(data.topPrograms[0].learners).toBe(1);
  expect(data.recentStudents.map(row=>row.id)).toEqual(['learner']);
  expect(JSON.stringify(data.recentActivity)).not.toContain('[QA E2E]');
 });
 it('resolves the program title for completed enrollment outcome alerts',async()=>{
  state.rows.program_enrollments=[{id:'completed',user_id:'learner',program_id:'program',status:'completed'}];
  state.rows.programs=[{id:'program',slug:'hvac-technician',title:'HVAC Certification',published:true,status:'active'}];
  const data=await getAdminDashboardData();
  expect(data.noOutcomeEnrollments[0]).toMatchObject({program_title:'HVAC Certification'});
 });
 it('counts completions and inactive states beyond the first thousand enrollments',async()=>{
  state.rows.program_enrollments=Array.from({length:1001},(_,i)=>({id:String(i),program_id:'program',status:i===1000?'completed':i===999?'inactive':'active',created_at:'2026-10-01T00:00:00Z'}));
  state.rows.programs=[{id:'program',title:'Training'}];
  const data=await getAdminDashboardData();
  expect(data.counts.activeEnrollments).toBe(999);
  expect(data.topPrograms[0]).toMatchObject({learners:1001,completed:1});
  expect(data.studentStatuses.find(s=>s.name==='completed')?.value).toBe(1);
  expect(data.studentStatuses.find(s=>s.name==='inactive')?.value).toBe(1);
  expect(state.ranges).toContain('program_enrollments:1000');
 });
 it('uses one explicit-cent invoice snapshot rather than a capped table page',async()=>{
  state.invoiceSnapshot={all_time_cents:'100100',this_month_cents:'100100',paid_count:1001,all_time_available:true,month_available:true};
  const data=await getAdminDashboardData();
  expect(data.revenueAllTimeCents).toBe(100100);
  expect(data.paidInvoiceSummary?.paidCount).toBe(1001);
  expect(state.rpcCalls).toEqual(['get_admin_paid_invoice_totals']);
 });
 it('does not infer invoice value from larger overlapping payment snapshots',async()=>{
  state.invoiceSnapshot={all_time_cents:'10000',this_month_cents:'10000',paid_count:1,all_time_available:true,month_available:true};
  state.rows.program_enrollments=[{id:'enrollment',status:'active',amount_paid_cents:9900000}];
  state.rows.stripe_sessions_staging=[{session_id:'old',amount:50000,payment_status:'paid',email:'learner@example.org',created_at:new Date().toISOString()}];
  const data=await getAdminDashboardData();
  expect(data.revenueAllTimeCents).toBe(10000);
  expect(data.counts.revenueThisMonthCents).toBe(10000);
  expect(data.kpis.find(k=>k.label==='Paid Invoices This Month')?.unavailable).toBe(false);
 });
 it('uses lead creation for new leads and last contact for stale leads',async()=>{
  const today=new Date().toISOString();
  state.rows.crm_leads=[{id:'edited-old',created_at:'2020-01-01T00:00:00Z',updated_at:today},{id:'contacted',created_at:'2020-01-01T00:00:00Z',last_contact_at:today},{id:'new',created_at:today,updated_at:today}];
  const data=await getAdminDashboardData();
  expect(data.operational.newLeadsToday).toBe(1);
  expect(data.staleLeads.map(l=>l.id)).toEqual(['edited-old']);
 });
 it('uses actual lesson activity instead of enrollment record edits for inactivity',async()=>{
  const today=new Date().toISOString();
  state.rows.program_enrollments=[{id:'active-lesson',user_id:'learner-1',status:'active',created_at:'2020-01-01T00:00:00Z',updated_at:'2020-01-01T00:00:00Z'},{id:'only-admin-edit',user_id:'learner-2',status:'active',created_at:'2020-01-01T00:00:00Z',updated_at:today}];
  state.rows.lesson_progress=[{id:'progress',user_id:'learner-1',enrollment_id:'active-lesson',last_watched:today}];
  const data=await getAdminDashboardData();
  expect(data.inactiveLearners.map(l=>l.enrollmentId)).toEqual(['only-admin-edit']);
  state.fail.add('lesson_progress');
  const failed=await getAdminDashboardData();
  expect(failed.inactiveLearners).toEqual([]);
  expect(failed.degradedSections).toContain('dashboard_data');
 });
 it('reports completed enrollments missing a matching recorded employment outcome',async()=>{
  state.rows.program_enrollments=[{id:'tracked',user_id:'learner',program_slug:'hvac',status:'completed'},{id:'missing',user_id:'learner',program_slug:'barber',status:'completed'},{id:'not-complete',user_id:'other',status:'active'}];
  state.rows.employment_outcomes=[{id:'outcome',user_uuid:'learner',program_slug:'hvac',outcome_type:'employment'}];
  const data=await getAdminDashboardData();
  expect(data.noOutcomeEnrollments.map(row=>row.id)).toEqual(['missing']);
 });
 it('marks failed certificate and document counts unavailable',async()=>{
  state.fail.add('certificates');state.fail.add('program_holder_documents');
  const data=await getAdminDashboardData();
  expect(data.degradedSections).toContain('dashboard_data');
  expect(data.kpis.find(k=>k.label==='Certificates Issued')?.unavailable).toBe(true);
  expect(data.kpis.find(k=>k.label==='Pending Documents')?.unavailable).toBe(true);
 });
 it('fails authorization before creating the privileged database client',async()=>{
  state.authorize.mockRejectedValue(new Error('forbidden'));
  await expect(getAdminDashboardData()).rejects.toThrow('forbidden');
  expect(state.authorize).toHaveBeenCalledWith(['admin','super_admin']);
  expect(state.admin).not.toHaveBeenCalled();
 });
});

