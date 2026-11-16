import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const compile=(s,dep,returns)=>new Function('d',`const {${Object.keys(dep).join(',')}}=d;`+stripTypeScriptTypes(s).replace(/^import .*;\r?$/gm,'').replace(/^export /gm,'')+`;return ${returns};`)(dep);
const commitWebsiteDraft=compile(await read('lib/apps/website-builder-draft-commit.ts'),{randomUUID},'commitWebsiteDraft');
const sources={generate:await read('apps/marketing/app/api/apps/website-builder/ai-generate/route.ts'),import:await read('apps/marketing/app/api/apps/website-builder/sites/route.ts')};
const config={template:{id:'executive'},branding:{},homepage:{},footer:{},meta:{parisInterviewCompleted:true},pages:[]};
function fixture(mode,{user={id:'owner',email:'owner@example.test'},access={allowed:true,plan:'starter'},sites=[],readError=null,rpcError=null}={}){
 const calls=[];
 const db={from(table){assert.equal(table,'user_websites');return {select(){return this},eq(){return this},order(){return Promise.resolve({data:sites,error:readError})}}},auth:{getUser:async()=>({data:{user}})}};
 const admin={...db,rpc:async(name,args)=>{calls.push({name,args});return {error:rpcError,data:rpcError?null:{website:{id:'saved'},creditsCharged:60,creditsRemaining:100}}}};
 const deps={createClient:async()=>db,requireAdminClient:async()=>admin,commitWebsiteDraft,
  getWebsiteBuilderAccess:async()=>access,buildDefaultSiteConfig:()=>config,ensureComposableSiteConfig:x=>x,sanitizePages:x=>x,
  buildLicensedAssetProjectPolicy:()=>({}),NextResponse:{json:(body,options={})=>({body,status:options.status||200})},
  applyRateLimit:async()=>null,hydrateProcessEnv:async()=>{},runAITask:async()=>({content:JSON.stringify(config)}),
  validateSiteConfig:()=>({valid:true}),consumeWebsiteBuilderCredits:async(_db,_user,operation,options)=>{assert.equal(operation,'initial_site_generation');assert.equal(options.deferDebitUntilCommit,true);return {allowed:true,charged:0,isTrial:true}},
  missingRequiredWebsiteAnswers:()=>[],readWebsiteDesign:x=>x,interviewWebsiteDesign:x=>x,applyWebsiteDesign:x=>x,websiteCatalog:()=>[],withApiAudit:(_path,fn)=>fn,logger:{error(){},warn(){}}};
 return {calls,post:compile(sources[mode],deps,'POST')};
}
const request=(body={})=>({json:async()=>({businessName:'Example',brief:'A sufficiently detailed business description for generation.',...body})});
for(const mode of ['generate','import']){
 test(`${mode} denies signed-out and denied subscription before writes`,async()=>{
  for(const options of [{user:null},{access:{allowed:false}}]){const f=fixture(mode,options);const r=await f.post(request());assert.ok([401,403].includes(r.status));assert.equal(f.calls.length,0)}
 });
 test(`${mode} fails closed on owned-site read error`,async()=>{const f=fixture(mode,{readError:{message:'unavailable'}});assert.equal((await f.post(request())).status,503);assert.equal(f.calls.length,0)});
 test(`${mode} carries original placeholder token and server-owned billing`,async()=>{
  const f=fixture(mode,{sites:[{id:'existing',updated_at:'precise-token',site_config:{meta:{parisInterviewCompleted:false}}}]});
  assert.equal((await f.post(request())).status,200);assert.equal(f.calls.length,1);
  const args=f.calls[0].args;assert.equal(args.p_expected_updated_at,'precise-token');assert.equal(args.p_website_id,'existing');assert.equal(args.p_actor_id,'owner');assert.equal(args.p_charge_trial,mode==='generate');
 });
 test(`${mode} reports stale commit without claiming a charge`,async()=>{const f=fixture(mode,{rpcError:{code:'P0409'}});const r=await f.post(request());assert.equal(r.status,409);if(mode==='generate')assert.equal(r.body.creditsCharged,0)});
 test(`${mode} preserves enterprise unlimited plan`,async()=>{const f=fixture(mode,{access:{allowed:true,plan:'enterprise'},sites:Array.from({length:5},(_,id)=>({id,site_config:config}))});assert.equal((await f.post(request())).status,201);assert.equal(f.calls[0].args.p_plan,'enterprise')});
}
test('import rejects another owner target',async()=>{const f=fixture('import');assert.equal((await f.post(request({existingSiteId:randomUUID()}))).status,404);assert.equal(f.calls.length,0)});
test('lost commit response retries exact receipt arguments once',async()=>{const calls=[];const admin={rpc:async(n,a)=>{calls.push(a);return calls.length===1?{data:null,error:{message:'lost response'}}:{data:{website:{id:'saved'}},error:null}}};const result=await commitWebsiteDraft(admin,{});assert.equal(calls.length,2);assert.deepEqual(calls[0],calls[1]);assert.equal(result.data.website.id,'saved')});

test('import preserves shared grouped navigation through normalization',async()=>{const f=fixture('import');const groups=[{label:'Explore',pageIds:['home']}];await f.post(request({siteConfig:{...config,navigationGroups:groups}}));assert.deepEqual(f.calls[0].args.p_site_config.navigationGroups,groups)});
