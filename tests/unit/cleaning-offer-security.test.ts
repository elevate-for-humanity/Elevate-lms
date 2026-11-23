import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({context:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/cleaning/server',async original=>({...await original<any>(),cleaningContext:mocks.context,rpc:mocks.rpc}));
import {GET,POST} from '@/apps/marketing/app/api/tenant-sites/cleaning/offers/route';
const id='00000000-0000-4000-8000-000000000001';const token='a'.repeat(64);
function query(data:any){const q:any={};for(const key of ['select','eq'])q[key]=vi.fn(()=>q);q.single=q.maybeSingle=vi.fn(async()=>({data,error:null}));return q;}
let job:any,provider:any,offer:any,from:any;
function setup(){from=vi.fn((table:string)=>query(table==='cleaning_offers'?offer:table==='cleaning_jobs'?job:provider));mocks.context.mockResolvedValue({db:{from}});}
const request=(post=false,origin='https://www.elevateforhumanity.org')=>new NextRequest(`https://www.elevateforhumanity.org/api/tenant-sites/cleaning/offers?id=${id}`,{method:post?'POST':'GET',headers:{Authorization:`Bearer ${token}`,Origin:origin,'Content-Type':'application/json'},...(post?{body:JSON.stringify({confirm:true})}:{})});
beforeEach(()=>{vi.clearAllMocks();offer={id,job_id:'job',provider_id:'provider',status:'open',expires_at:new Date(Date.now()+86400000).toISOString()};job={status:'offered',service:'standard',zip:'46204',summary:'Office floor cleaning',provider_pay_cents:9000,cleaner_hours:3,private_details:'SECRET ACCESS CODE',customer_email:'private@example.invalid',customer_name:'PRIVATE CUSTOMER'};provider={eligibility:'eligible',opted_in:true};setup();});
describe('cleaning offer capability',()=>{
 it('GET previews no customer data and never claims a job',async()=>{const r=await GET(request());expect(r.status).toBe(200);const body=JSON.stringify(await r.json());expect(body).not.toContain('SECRET');expect(body).not.toContain('private@example');expect(body).not.toContain(token);expect(mocks.rpc).not.toHaveBeenCalled();});
 it('requires POST confirmation and hashes the capability before the atomic claim',async()=>{mocks.rpc.mockResolvedValue({job_id:'job'});const r=await POST(request(true));expect(r.status).toBe(200);expect(mocks.rpc).toHaveBeenCalledWith(expect.anything(),'cleaning_accept_offer',expect.objectContaining({p_offer_id:id,p_token_hash:expect.stringMatching(/^[a-f0-9]{64}$/)}));expect(mocks.rpc.mock.calls[0][2].p_token_hash).not.toBe(token);});
 it('rejects cross-origin acceptance without a database claim',async()=>{expect((await POST(request(true,'https://attacker.invalid'))).status).toBe(403);expect(mocks.rpc).not.toHaveBeenCalled();});
 it('rejects expired and revoked providers before revealing job instructions',async()=>{offer.expires_at=new Date(0).toISOString();expect((await GET(request())).status).toBe(403);offer.expires_at=new Date(Date.now()+86400000).toISOString();provider.eligibility='suspended';const r=await GET(request());expect(r.status).toBe(403);expect(JSON.stringify(await r.json())).not.toContain('SECRET');});
 it('reveals instructions only to the accepted eligible provider',async()=>{offer.status='accepted';job.status='assigned';job.provider_id='provider';const r=await GET(request());expect(r.status).toBe(200);expect((await r.json()).job.private_details).toBe('SECRET ACCESS CODE');});
});
