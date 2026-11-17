import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const compile=(s,dep,returns)=>new Function('d',`const {${Object.keys(dep).join(',')}}=d;`+stripTypeScriptTypes(s).replace(/^import .*;\r?$/gm,'').replace(/^export /gm,'')+`;return ${returns};`)(dep);
const suppliedWebsiteContact=compile(await read('lib/tenant/footer-contact.ts'),{},'suppliedWebsiteContact');
const validateFooterContactFields=compile(await read('lib/tenant/footer-contact.ts'),{},'validateFooterContactFields');
const validateHeroBackdropFields=compile(await read('lib/tenant/site-validation.ts'),{},'validateHeroBackdropFields');
const resolveSiteLinkGroups=compile(await read('lib/tenant/site-navigation.ts'),{},'resolveSiteLinkGroups');
const composition=compile(await read('lib/tenant/site-composition.ts'),{resolveSiteLinkGroups},'({ensureComposableSiteConfig,sanitizePages,normalizePageSlug})');
const realValidateSiteConfig=compile(await read('lib/tenant/site-validation.ts'),{...composition,validateFooterContactFields},'validateSiteConfig');
const realDesign=compile(await read('lib/website-builder/design-choices.ts'),{},'({readWebsiteDesign,interviewWebsiteDesign,applyWebsiteDesign,websiteCatalog})');
const diagnostics=[];
const commitWebsiteDraft=compile(await read('lib/apps/website-builder-draft-commit.ts'),{randomUUID,logger:{error:(...args)=>diagnostics.push(args)}},'commitWebsiteDraft');
const sources={generate:await read('apps/marketing/app/api/apps/website-builder/ai-generate/route.ts'),import:await read('apps/marketing/app/api/apps/website-builder/sites/route.ts')};
const config={template:{id:'executive'},branding:{logoText:'Example'},seo:{title:'Example',description:'A customer studio.'},homepage:{},footer:{},meta:{parisInterviewCompleted:true},pages:[{id:'home',slug:'/',title:'Home',sections:[{id:'hero',type:'hero',content:{title:'Example',backdropImage:'/approved-studio.svg',image:'/owner.webp'},settings:{backdropPosition:'right',backdropOpacity:20}}]}]};
function fixture(mode,{user={id:'owner',email:'owner@example.test'},access={allowed:true,plan:'starter'},sites=[],readError=null,rpcError=null,generated=config,realNormalization=false}={}){
 const calls=[];
 const db={from(table){assert.equal(table,'user_websites');return {select(){return this},eq(){return this},order(){return Promise.resolve({data:sites,error:readError})}}},auth:{getUser:async()=>({data:{user}})}};
 const admin={...db,rpc:async(name,args)=>{calls.push({name,args});return {error:rpcError,data:rpcError?null:{website:{id:'saved'},creditsCharged:60,creditsRemaining:100}}}};
 const deps={createClient:async()=>db,requireAdminClient:async()=>admin,commitWebsiteDraft,
  getWebsiteBuilderAccess:async()=>access,buildDefaultSiteConfig:()=>config,ensureComposableSiteConfig:realNormalization?composition.ensureComposableSiteConfig:x=>x,sanitizePages:realNormalization?composition.sanitizePages:x=>x,
  buildLicensedAssetProjectPolicy:()=>({}),NextResponse:{json:(body,options={})=>({body,status:options.status||200})},
  applyRateLimit:async()=>null,hydrateProcessEnv:async()=>{},runAITask:async()=>({content:JSON.stringify(generated)}),
  validateHeroBackdropFields,validateFooterContactFields,suppliedWebsiteContact,validateSiteConfig:realNormalization?realValidateSiteConfig:()=>({valid:true}),consumeWebsiteBuilderCredits:async(_db,_user,operation,options)=>{assert.equal(operation,'initial_site_generation');assert.equal(options.deferDebitUntilCommit,true);return {allowed:true,charged:0,isTrial:true}},
  missingRequiredWebsiteAnswers:()=>[],readWebsiteDesign:realNormalization?realDesign.readWebsiteDesign:x=>x,interviewWebsiteDesign:realNormalization?realDesign.interviewWebsiteDesign:x=>x,applyWebsiteDesign:realNormalization?realDesign.applyWebsiteDesign:x=>x,websiteCatalog:realNormalization?realDesign.websiteCatalog:()=>[],withApiAudit:(_path,fn)=>fn,logger:{error(){},warn(){}}};
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

for(const mode of ['generate','import']) test(mode+' rejects raw malformed backdrop fields before normalization or commit',async()=>{
 for(const patch of [{settings:{backdropPosition:['right']}},{settings:{backdropOpacity:{value:12}}},{settings:{backdropOpacity:null}},{content:{backdropImage:{url:'/graphic.svg'}}}]) {
  const bad=structuredClone(config);Object.assign(bad.pages[0].sections[0],patch);
  const f=fixture(mode,{generated:bad,realNormalization:true});const response=await f.post(request({siteConfig:bad}));
  assert.equal(response.status,422);assert.equal(f.calls.length,0);assert.ok(response.body.validation.errors[0].code.startsWith('invalid_hero_backdrop'));
 }
});

for(const mode of ['generate','import']) test(mode+' persists valid backdrop with real normalization and validation',async()=>{
 const f=fixture(mode,{realNormalization:true});const r=await f.post(request({siteConfig:config}));
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(f.calls[0].args.p_site_config.pages[0].sections[0].settings.backdropPosition,'right');
 const hero=f.calls[0].args.p_site_config.pages[0].sections[0];
 assert.equal(hero.content.backdropImage,'/approved-studio.svg');assert.equal(hero.content.image,'/owner.webp');assert.equal(hero.settings.backdropOpacity,20);
 assert.equal(realValidateSiteConfig(f.calls[0].args.p_site_config).valid,true);
});


for(const mode of ['generate','import']) test(mode+' validates and persists the optional footer contact setting',async()=>{
 for(const invalid of [null,'true',1,[],{}]) {
  const bad={...config,footer:{showContactDetails:invalid}};
  const f=fixture(mode,{generated:bad,realNormalization:true});
  const response=await f.post(request({siteConfig:bad}));
  assert.equal(response.status,422);assert.equal(f.calls.length,0);
  assert.equal(response.body.validation.errors[0].code,'invalid_footer_contact');
 }
 const good={...config,footer:{showContactDetails:true}};
 const f=fixture(mode,{generated:good,realNormalization:true});
 assert.equal((await f.post(request({siteConfig:good}))).status,201);
 assert.equal(f.calls[0].args.p_site_config.footer.showContactDetails,true);
});


for(const briefMode of [true,false]) test('generation persists only supplied contact values through real transformations: brief='+briefMode, async()=>{
 const contact={email:'public@example.test',phone:'+1 (555) 123-4567',address:'123 Example Road',hours:['Monday 9–5']};
 const generated={...config,footer:{showContactDetails:true},contact};
 const f=fixture('generate',{generated,realNormalization:true});
 const supplied=Object.values(contact).flat().join(' | ');
 const body=briefMode?{brief:'Owner requests a contact footer. Publish these contact values: '+supplied}:{brief:undefined,answers:{businessName:'Example',contacts:supplied}};
 const response=await f.post(request(body));assert.equal(response.status,201,JSON.stringify(response.body));
 assert.deepEqual(f.calls[0].args.p_site_config.contact,contact);
 assert.equal(f.calls[0].args.p_site_config.footer.showContactDetails,true);
});
test('generation omits fabricated, malformed, account-only and oversized contact data',async()=>{
 for(const contact of [null,[],{email:'owner@example.test',phone:123,address:{text:'123 Road'},hours:['Unprovided hours']},{email:'x'.repeat(181),hours:'Monday'}]) {
  const f=fixture('generate',{generated:{...config,footer:{showContactDetails:true},contact},realNormalization:true});
  assert.equal((await f.post(request())).status,201);assert.deepEqual(f.calls[0].args.p_site_config.contact,{});
 }
});


test('generation rejects partial email and phone tokens while preserving exact owner contacts',async()=>{
 const source='Email: xsales@example.com; Phone: +1 (555) 123-4567';
 for(const contact of [{email:'sales@example.com'}, {email:'xsales@example.co'}, {phone:'555'}, {phone:'123-4567'}, {phone:'1 (555) 123-4567'}]) {
  const f=fixture('generate',{generated:{...config,contact},realNormalization:true});
  assert.equal((await f.post(request({brief:'Publish contact values exactly as supplied. '+source}))).status,201);
  assert.deepEqual(f.calls[0].args.p_site_config.contact,{});
 }
 const contact={email:'xsales@example.com',phone:'+1 (555) 123-4567'};
 const f=fixture('generate',{generated:{...config,contact},realNormalization:true});
 assert.equal((await f.post(request({brief:'Publish contact values exactly as supplied. '+source}))).status,201);
 assert.deepEqual(f.calls[0].args.p_site_config.contact,contact);
});
test('generation preserves hours from the actual Scheduling interview field',async()=>{
 const questions=compile(await read('lib/website-builder/interview.ts'),{},'WEBSITE_INTERVIEW_QUESTIONS');
 assert.ok(questions.some(question=>question.key==='scheduling'&&question.label==='Scheduling'));
 const contact={email:'public@example.test',phone:'+1 (555) 123-4567',address:'123 Example Road',hours:['Monday 9–5']};
 const f=fixture('generate',{generated:{...config,footer:{showContactDetails:true},contact},realNormalization:true});
 const response=await f.post(request({brief:undefined,answers:{businessName:'Example',contacts:'public@example.test; +1 (555) 123-4567',locations:'123 Example Road',scheduling:'Monday 9–5'}}));
 assert.equal(response.status,201,JSON.stringify(response.body));assert.deepEqual(f.calls[0].args.p_site_config.contact,contact);
});

test('generation never strips unsupported email prefixes or contact-adjacent letters', async()=>{
 const f=fixture('generate',{generated:{...config,contact:{email:'sales@example.com',phone:'5551234567'}},realNormalization:true});
 assert.equal((await f.post(request({brief:'Use these details exactly: %sales@example.com and ABC5551234567XYZ, no invented contacts.'}))).status,201);
 assert.deepEqual(f.calls[0].args.p_site_config.contact,{});
});

test('generation retains complete phones before sentence-ending periods and numeric addresses',async()=>{
 for(const phone of ['317-555-0123','317.555.0123']) {
  const f=fixture('generate',{generated:{...config,contact:{phone,address:'123 Main Street'}},realNormalization:true});
  assert.equal((await f.post(request({brief:'Owner asks to publish: Call '+phone+'. 123 Main Street. Contact column requested.'}))).status,201);
  assert.deepEqual(f.calls[0].args.p_site_config.contact,{phone,address:'123 Main Street'});
 }
});

test('generation retains email addresses surrounded by prose punctuation',async()=>{
 for(const supplied of ['sales@example.com!','sales@example.com?','sales@example.com\u0027',"'sales@example.com'"]) {
  const contact={email:'sales@example.com'};
  const f=fixture('generate',{generated:{...config,footer:{showContactDetails:true},contact},realNormalization:true});
  assert.equal((await f.post(request({brief:'Build the requested business website with these owner-supplied details. Email us at '+supplied}))).status,201);
  assert.deepEqual(f.calls[0].args.p_site_config.contact,contact);
 }
 for(const supplied of ['%sales@example.com',"o'sales@example.com","'sales@example.com",'sales@example.com!evil','sales@example.com?subject=private']) {
  const f=fixture('generate',{generated:{...config,contact:{email:'sales@example.com'}},realNormalization:true});
  assert.equal((await f.post(request({brief:'Build the requested business website using only these owner-supplied details: '+supplied}))).status,201);
  assert.deepEqual(f.calls[0].args.p_site_config.contact,{});
 }
});

test('generation retains complete phones beside parenthesized availability',async()=>{
 for(const phone of ['317-555-0123','317.555.0123','+1 (317) 555-0123','+44 (20) 7946 0958']) {
  const contact={phone};
  const f=fixture('generate',{generated:{...config,footer:{showContactDetails:true},contact},realNormalization:true});
  assert.equal((await f.post(request({brief:'Build the requested business website with these owner-supplied details. Call '+phone+' (9-5).'}))).status,201);
  assert.deepEqual(f.calls[0].args.p_site_config.contact,contact);
 }
 const f=fixture('generate',{generated:{...config,contact:{phone:'9-5'}},realNormalization:true});
 assert.equal((await f.post(request({brief:'Build the requested business website. Call 317-555-0123 (9-5).'}))).status,201);
 assert.deepEqual(f.calls[0].args.p_site_config.contact,{});
});

test('generation folds phone whitespace without accepting fragments',async()=>{
 for(const whitespace of ['\n','\t']) {
  for(const phone of ['+1 (317) 555-0123','555-0123','(317) 555-0123']) {
   const f=fixture('generate',{generated:{...config,footer:{showContactDetails:true},contact:{phone}},realNormalization:true});
   assert.equal((await f.post(request({brief:'Build the requested business website with these owner-supplied details. Call +1 (317)'+whitespace+'555-0123 for details.'}))).status,201);
   assert.deepEqual(f.calls[0].args.p_site_config.contact,phone.startsWith('+1')?{phone}:{});
  }
 }
});
