import {beforeEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const h=vi.hoisted(()=>({queries:[] as any[],denied:false}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:async()=>h.denied?{error:new Response(null,{status:403})}:{}}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 const query={table,filters:[] as any[]};h.queries.push(query);
 const data=table==='ultimate_build_jobs'?[{id:'selected-job'}]:table==='paris_autopilot_policy'?{enabled:true,max_daily_repairs:3}:[];
 const q:any={select:()=>q,eq:(...args:any[])=>{query.filters.push(args);return q;},in:(...args:any[])=>{query.filters.push(args);return q;},gte:()=>q,order:()=>q,limit:()=>q,maybeSingle:()=>q,then:(resolve:any)=>Promise.resolve(resolve({data,error:null}))};return q;
}})}));
import {GET} from '@/apps/admin/app/api/paris/supervision/route';
beforeEach(()=>{h.queries=[];h.denied=false;});
it('selected course supervision reads only its worker and correlated repairs',async()=>{
 const id='00000000-0000-4000-8000-000000000001';const response=await GET(new NextRequest('https://admin.example/api/paris/supervision?buildId='+id));
 expect(response.status).toBe(200);
 expect(h.queries.find(q=>q.table==='ultimate_build_jobs').filters).toContainEqual(['build_id',id]);
 expect(h.queries.find(q=>q.table==='paris_code_repairs').filters).toContainEqual(['source_job_id',['selected-job']]);
 expect(response.headers.get('cache-control')).toBe('no-store');
});
it('unauthorized and malformed requests cannot read supervision records',async()=>{
 h.denied=true;expect((await GET(new NextRequest('https://admin.example/api/paris/supervision'))).status).toBe(403);expect(h.queries).toHaveLength(0);
 h.denied=false;expect((await GET(new NextRequest('https://admin.example/api/paris/supervision?buildId=invalid'))).status).toBe(400);expect(h.queries).toHaveLength(0);
});
