import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({context:vi.fn(),invoice:vi.fn()}));
vi.mock('@/lib/cleaning/server',async original=>({...await original<any>(),cleaningContext:mocks.context}));
vi.mock('@/lib/cleaning/billing',()=>({cleaningInvoice:mocks.invoice}));
import {POST} from '@/apps/marketing/app/api/tenant-sites/cleaning/jobs/route';
const id='00000000-0000-4000-8000-000000000001';
let job:any,providers:any[],chains:any[];
function chain(data:any){const q:any={};for(const key of ['select','eq','contains','lte','order'])q[key]=vi.fn(()=>q);q.maybeSingle=q.single=vi.fn(async()=>({data,error:null}));q.limit=vi.fn(async()=>({data,error:null}));chains.push(q);return q;}
const req=(extra={})=>new NextRequest('https://www.elevateforhumanity.org/api/tenant-sites/cleaning/jobs',{method:'POST',headers:{Origin:'https://www.elevateforhumanity.org','Content-Type':'application/json'},body:JSON.stringify({action:'checkout',id,...extra})});
beforeEach(()=>{vi.clearAllMocks();chains=[];providers=[{id:'provider'}];job={id,status:'quoted',quote_expires_at:new Date(Date.now()+86400000).toISOString(),zip:'46204',service:'standard',hourly_cents:3000,customer_cents:10800,customer_name:'Customer'};mocks.context.mockResolvedValue({db:{from:vi.fn((table:string)=>chain(table==='cleaning_jobs'?job:providers))},user:{id:'verified-user',email:'verified@example.invalid',email_confirmed_at:new Date().toISOString()}});mocks.invoice.mockResolvedValue({checkoutUrl:'https://connect.intuit.com/pay/test'});});
describe('cleaning checkout snapshot',()=>{
 it('ignores client prices and recipients and charges the stored quote for the verified customer',async()=>{const r=await POST(req({amount:1,email:'attacker@example.invalid',customerId:'other'}));expect(r.status).toBe(200);expect(mocks.invoice).toHaveBeenCalledWith(expect.anything(),expect.objectContaining({amount:10800,email:'verified@example.invalid',recordId:id,type:'cleaning_job'}));expect(chains[0].eq).toHaveBeenCalledWith('customer_id','verified-user');});
 it('does not create invoices if no matching eligible provider exists',async()=>{providers=[];expect((await POST(req())).status).toBe(409);expect(mocks.invoice).not.toHaveBeenCalled();});
 it('does not charge expired quotes',async()=>{job.quote_expires_at=new Date(0).toISOString();expect((await POST(req())).status).toBe(409);expect(mocks.invoice).not.toHaveBeenCalled();});
 it('requires a verified email, not merely a session',async()=>{mocks.context.mockResolvedValue({db:{},user:{id:'unverified',email:'notverified@example.invalid'}});expect((await POST(req())).status).toBe(401);expect(mocks.invoice).not.toHaveBeenCalled();});
});
