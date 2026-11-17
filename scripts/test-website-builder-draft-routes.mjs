import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const compile=(s,dep,returns)=>new Function('d',`const {${Object.keys(dep).join(',')}}=d;`+stripTypeScriptTypes(s).replace(/^import .*;\r?$/gm,'').replace(/^export /gm,'')+`;return ${returns};`)(dep);
const diagnostics=[];
const commitWebsiteDraft=compile(await read('lib/apps/website-builder-draft-commit.ts'),{randomUUID,logger:{error:(...args)=>diagnostics.push(args)}},'commitWebsiteDraft');
const sources={generate:await read('apps/marketing/app/api/apps/website-builder/ai-generate/route.ts'),import:await read('apps/marketing/app/api/apps/website-builder/sites/route.ts')};
const config={template:{id:'executive'},branding:{},homepage:{},footer:{},meta:{parisInterviewCompleted:true},pages:[{id:'home',slug:'/',title:'Home',sections:[{id:'hero',type:'hero',content:{title:'Example',backdropImage:'/approved-studio.svg',image:'/owner.webp'},settings:{backdropPosition:'right',backdropOpacity:20}}]}]};
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

test('failed commit logs one bounded diagnostic without customer payload',async()=>{
 for(const code of ['42501','PGRST202','P0503',undefined]) {
  diagnostics.length=0;let calls=0;
  const result=await commitWebsiteDraft({rpc:async()=>{calls++;return {data:null,error:{code,message:'SECRET SITE CONTENT',details:'PRIVATE BACKUP'}}}}, {p_operation:'import',p_site_config:{secret:'DO NOT LOG'}});
  assert.equal(calls,code?1:2);assert.equal(diagnostics.length,1);
  assert.deepEqual(diagnostics[0][1],{requestId:result.requestId,operation:'import',code:code||'UNKNOWN'});
  assert.doesNotMatch(JSON.stringify(diagnostics),/SECRET|PRIVATE|DO NOT LOG/);
 }
});
test('a recovered transport response does not log a failed commit',async()=>{
 diagnostics.length=0;let calls=0;
 await commitWebsiteDraft({rpc:async()=>++calls===1?{data:null,error:{message:'transport'}}:{data:{website:{id:'saved'}},error:null}},{});
 assert.equal(diagnostics.length,0);
});

test('generation preserves approved decorative layer independently of foreground image',async()=>{const f=fixture('generate');await f.post(request());const hero=f.calls[0].args.p_site_config.pages[0].sections[0];assert.equal(hero.content.backdropImage,'/approved-studio.svg');assert.equal(hero.content.image,'/owner.webp');assert.equal(hero.settings.backdropPosition,'right');assert.equal(hero.settings.backdropOpacity,20)});
