import { beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({ failure:'', reads:0, rpc:vi.fn() }));
vi.mock('@/lib/audit/withApiAudit',()=>({withApiAudit:(_path:string,handler:any)=>handler}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/barber/suspension',()=>({checkBarberSuspension:async()=>null}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'learner'}}})}})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({
 from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({error:null,data:table==='apprentice_sites'?{latitude:40,longitude:-86,radius_meters:100}:++mock.reads===1?{id:'shift',site_id:'site',clock_out_at:null,apprentices:{user_id:'learner'}}:{clock_out_at:'2026-10-27T10:00:00Z',auto_clocked_out:true}})};return q;},
 rpc:async(name:string)=>{mock.rpc(name);return {data:{within_geofence:true,clock_out_at:null},error:mock.failure===name?new Error('unavailable'):null};},
})}));
import { POST } from '@/apps/lms/app/api/timeclock/heartbeat/route';
beforeEach(()=>{mock.failure='';mock.reads=0;mock.rpc.mockClear();});
function request(body:any){return new Request('http://localhost/api/timeclock/heartbeat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}) as any;}
const valid={entry_id:'shift',lat:40,lng:-86,accuracy_m:10};
it('returns authoritative closure after the auto-clock-out RPC',async()=>{
 const res=await POST(request(valid));expect(res.status).toBe(200);const data=await res.json();
 expect(data.clock_out_at).toBe('2026-10-27T10:00:00Z');expect(data.auto_clocked_out).toBe(true);
});
it.each(['update_geofence_state','auto_clock_out_if_needed'])('reports %s failure instead of successful attendance',async(name)=>{
 mock.failure=name;const res=await POST(request(valid));expect(res.status).toBe(503);
});
it.each([{lat:'40'}, {lat:null}, {lng:200}, {accuracy_m:-1}, {accuracy_m:51}])('rejects malformed GPS %j before changing attendance',async(extra)=>{
 const res=await POST(request({...valid,...extra}));expect(res.status).toBe(400);expect(mock.rpc).not.toHaveBeenCalled();
});
