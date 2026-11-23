import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({send:vi.fn()}));
vi.mock('@/lib/email/sendgrid',()=>({sendEmail:mocks.send}));
import {processCleaningOutbox} from '@/lib/cleaning/outbox';
import {CLEANING_SITE} from '@/lib/cleaning/server';
function database(enabled=true){
 const tables:Record<string,any[]>={
  user_websites:[{id:CLEANING_SITE,site_config:{meta:{cleaningNetworkEnabled:enabled},contact:{email:'operator@example.invalid'}}}],
  cleaning_jobs:[{id:'job',website_id:CLEANING_SITE,status:'offered',service:'standard',zip:'46204',starts_at:'2030-01-01T10:00:00Z',summary:'Office cleaning',cleaner_hours:3,provider_pay_cents:9000,private_details:'SECRET DOOR CODE',customer_email:'secret-customer@example.invalid'}],
  cleaning_offers:[{id:'offer',website_id:CLEANING_SITE,provider_id:'provider',status:'open',expires_at:'2030-01-01T09:00:00Z'}],
  cleaning_providers:[{id:'provider',website_id:CLEANING_SITE,email:'provider@example.invalid',eligibility:'eligible',opted_in:true}],
  cleaning_outbox:[{id:'mail',website_id:CLEANING_SITE,job_id:'job',kind:'offer',offer_id:'offer',capability:'a'.repeat(64),status:'pending'},{id:'foreign-mail',website_id:'other-site',status:'pending'}],
 };
 const db:any={rpc:vi.fn(async()=>({data:0,error:null})),from:(table:string)=>{
  const filters:Array<(r:any)=>boolean>=[];let update:any=null;let cap=100;
  const execute=()=>{const rows=(tables[table]||[]).filter(r=>filters.every(test=>test(r))).slice(0,cap);if(update)for(const row of rows)Object.assign(row,update);return {data:rows,error:null};};
  const q:any={select:()=>q,order:()=>q,eq:(k:string,v:any)=>{filters.push(r=>r[k]===v);return q;},lt:(k:string,v:any)=>{filters.push(r=>r[k]<v);return q;},update:(v:any)=>{update=v;return q;},limit:async(n:number)=>{cap=n;return execute();},single:async()=>{const r=execute();return {...r,data:r.data[0]};},maybeSingle:async()=>{const r=execute();return {...r,data:r.data[0]||null};},then:(resolve:any,reject:any)=>Promise.resolve(execute()).then(resolve,reject)};return q;
 }};return {db,tables};
}
beforeEach(()=>vi.clearAllMocks());
describe('cleaning delivery outbox',()=>{
 it('does no work while online cleaning is disabled',async()=>{const {db}=database(false);expect(await processCleaningOutbox(db)).toEqual({sent:0,held:0});expect(mocks.send).not.toHaveBeenCalled();expect(db.rpc).not.toHaveBeenCalled();});
 for(const success of [false,true])it(`sends individually, keeps private instructions out of offers, and does not send twice (${success})`,async()=>{
  const {db,tables}=database();mocks.send.mockResolvedValue({success});
  expect(await processCleaningOutbox(db)).toEqual({sent:success?1:0,held:success?0:1});
  expect(mocks.send).toHaveBeenCalledTimes(1);const options=mocks.send.mock.calls[0][0];expect(options.to).toBe('provider@example.invalid');expect(options.singleAttempt).toBe(true);expect(JSON.stringify(options)).not.toContain('SECRET DOOR CODE');expect(JSON.stringify(options)).not.toContain('secret-customer@example.invalid');
  expect(tables.cleaning_outbox[0].status).toBe(success?'sent':'unknown');expect(tables.cleaning_outbox[1].status).toBe('pending');
  await processCleaningOutbox(db);expect(mocks.send).toHaveBeenCalledTimes(1);
 });
});
