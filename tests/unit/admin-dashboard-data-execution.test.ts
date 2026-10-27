import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
const state=vi.hoisted(()=>({rows:{} as Record<string,any[]>,fail:new Set<string>(),ranges:[] as string[],authorize:vi.fn(),admin:vi.fn()}));
vi.mock('@/lib/auth/require-role',()=>({requireRole:state.authorize}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'admin'}}})}})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:state.admin}));
vi.mock('@/lib/admin/dashboard/get-system-health',()=>({getSystemHealth:async()=>({quickBooksWebhookOk:false,quickBooksBillingOk:false,buildEnvOk:true,staleJobs:0,degraded:false,missingDocuments:0,missingCertifications:0,unresolvedFlags:0,alerts:[]})}));
function database(){
 return {rpc:async()=>({data:0,error:null}),from(table:string){
  let start=0,end=Infinity,head=false,single=false;
  const query:any={select(_columns:string,options:any){head=options?.head===true;return query;},range(a:number,b:number){state.ranges.push(`${table}:${a}`);start=a;end=b;return query;},limit(n:number){end=n-1;return query;},maybeSingle(){single=true;return query;},then(resolve:any){return Promise.resolve({data:single?{full_name:'Admin',role:'admin'}:head?null:(state.rows[table]??[]).slice(start,end+1),count:(state.rows[table]??[]).length,error:state.fail.has(table)?{message:'database unavailable'}:null}).then(resolve);}};
  for(const method of ['eq','gt','gte','lt','in','like','ilike','not','order','abortSignal'])query[method]=()=>query;
  return query;
 }};
}
beforeEach(()=>{state.rows={};state.fail.clear();state.ranges=[];state.authorize.mockReset().mockResolvedValue({});state.admin.mockReset().mockResolvedValue(database());});
describe('executed admin dashboard data loader',()=>{
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
 it('includes voucher payments beyond the default API row ceiling',async()=>{
  state.rows.ita_vouchers=Array.from({length:1001},(_,i)=>({id:String(i),payments_to_date:1}));
  const data=await getAdminDashboardData();
  expect(data.revenueAllTimeCents).toBe(100100);
  expect(state.ranges).toContain('ita_vouchers:1000');
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
