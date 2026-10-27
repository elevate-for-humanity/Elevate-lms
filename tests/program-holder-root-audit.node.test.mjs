import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
const jsx = {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
function load(path,mocks={},globals={}) {
 const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const result=ts.transpileModule(source,{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
 const scope={exports:{},require:n=>mocks[n]??(n==='react/jsx-runtime'?jsx:{}),URL,Set,Map,Date,Error,process:{env:{}},...globals};vm.runInNewContext(result.outputText,scope);return scope.exports;
}
function dbFor(handler){return{from(table){const filters=[],writes=[];let operation='select',columns='';const q={select(c){columns=c;return q},eq(k,v){filters.push([k,v]);return q},in(){return q},is(){return q},order(){return q},limit(){return q},maybeSingle(){return q},single(){return q},insert(v){operation='insert';writes.push(v);return q},update(v){operation='update';writes.push(v);return q},then(resolve,reject){return Promise.resolve(handler({table,filters,writes,operation,columns})).then(resolve,reject)}};return q}}}
const next={NextResponse:{json:(body,options)=>({body,status:options?.status||200}),redirect:url=>({url,headers:new Map()})}};

test('new and legacy holder links resolve without granting approval or causing redirect loops',async()=>{
 for(const pending of [true,false]){
  const db=dbFor(({table,columns})=>({data:table==='program_holder_programs'?[]:columns==='id'?{id:'owned-holder'}:{user_id:'user',status:pending?'approved_pending_mou':'active',approved_at:pending?null:'2026-10-01',features:{}},error:null}));
  const api=load('lib/auth/require-program-holder.ts',{'@/lib/supabase/admin':{requireAdminClient:async()=>db},'next/navigation':{redirect:url=>{throw Error(url)}},'@/lib/auth/portal-access':{requirePortalAccess:async()=>({user:{id:'user'},profile:{id:'user',role:'program_holder'},isPlatformAdmin:false})},'@/lib/admin/portal-preview':{resolvePortalPreviewSubject:async()=>({previewing:false})}});
  assert.equal((await api.requireProgramHolder({allowPendingApproval:true})).holderId,'owned-holder');
  if(pending)await assert.rejects(api.requireProgramHolder(),/onboarding\?status=pending-approval/);else assert.equal((await api.requireProgramHolder()).holderId,'owned-holder');
 }
});

test('pending onboarding renders an actionable page instead of a redirect loop',async()=>{
 const page=load('apps/lms/app/program-holder/onboarding/page.tsx',{'next/link':'Link','next/navigation':{redirect:url=>{throw Error(url)}},'@/lib/auth/require-program-holder':{requireProgramHolder:async options=>{assert.equal(options.allowPendingApproval,true);return{mode:'holder',holderId:'holder',db:dbFor(()=>({data:{status:'approved_pending_mou',approved_at:null}}))}}}});assert.equal((await page.default()).type,'main');
});

test('verified hours stay in program, honor accepted hours, and count mirrored clocks once',()=>{
 const {verifiedTrainingForEnrollment:sum}=load('lib/program-holder/verified-hours.ts');const student={user_id:'s',program_id:'p',program_slug:'bookkeeping'};
 const hours=[{id:'h',user_id:'s',program_slug:'bookkeeping',approval_status:'approved',hours_claimed:8,accepted_hours:6,progress_entry_id:'c',work_date:'2026-10-20'},{id:'x',user_id:'s',program_slug:'hvac',status:'approved',hours_claimed:24}];
 const progress=[{id:'c',apprentice_id:'s',program_id:'p',status:'verified',hours_worked:8},{id:'d',apprentice_id:'s',program_id:'p',status:'verified',hours_worked:2},{id:'z',apprentice_id:'s',program_id:'other',status:'verified',hours_worked:30}];assert.equal(sum(student,hours,progress).total,8);assert.equal(sum(student,[...hours,hours[0]],[...progress,progress[1]]).total,8);
});

test('download checks document ownership and signs the correct private bucket',async()=>{
 for(const found of [true,false]){let signed=0,filters=[];const db=dbFor(q=>{filters=q.filters;return{data:found?{file_url:'protected/id.pdf',storage_bucket:'provider-documents'}:null,error:null}});db.storage={from:bucket=>{assert.equal(bucket,'provider-documents');return{createSignedUrl:async(_path,seconds)=>{signed++;assert.equal(seconds,60);return{data:{signedUrl:'https://storage.example/signed'},error:null}}}}};
 const api=load('apps/lms/app/api/program-holder/documents/[id]/download/route.ts',{'next/server':next,'@/lib/auth/require-program-holder':{requireProgramHolder:async()=>({mode:'holder',profile:{id:'owner'},db})}});const result=await api.GET({}, {params:Promise.resolve({id:'11111111-1111-4111-8111-111111111111'})});assert.ok(filters.some(([k,v])=>k==='user_id'&&v==='owner'));assert.equal(signed,found?1:0);if(!found)assert.equal(result.status,404);
 }
});

test('failed acknowledgement writes never report success',async()=>{
 for(const failing of ['select','insert']){const api=load('apps/lms/app/api/program-holder/acknowledgements/route.ts',{'next/server':next,'next/headers':{headers:async()=>({get:()=>null})},'@/lib/auth/require-program-holder':{requireProgramHolder:async()=>({mode:'holder',user:{id:'owner'},profile:{full_name:'Test'},db:dbFor(({operation})=>({data:null,error:operation===failing?{message:'Unavailable'}:null}))})},'@/lib/program-holder/onboarding-complete':{checkAndSendOnboardingCompleteEmail:async()=>{throw Error('Must not send')}}});const result=await api.POST({json:async()=>({handbook:true})});assert.ok(result.status>=500);assert.equal(result.body.ok,undefined);}
});

test('document, acknowledgement, alert, closeout and progress forms recover from network failure',async()=>{
 for(const name of ['ProgramHolderDocumentUpload','ProgramHolderAcknowledgements','ProgramHolderNotificationPreferences','ProgramHolderStudentCloseoutForm','ProgramHolderTrainingLogForm']){let states=[];const react={useState:v=>[v,n=>states.push(n)]};const exports=load(`components/program-holder/${name}.tsx`,{'react':react,'next/navigation':{useRouter:()=>({refresh(){}})},'@/lib/partners/enchanted-hearts':{ENCHANTED_HEARTS:{programs:[]},formatUsd:()=>''}},{fetch:async()=>{throw Error('Network unavailable')},FormData:class{get(){return ''}},window:{setTimeout(){}}});const tree=exports[name]({enrollments:[{id:'e'}],programs:[],verifiedHours:[],phone:''});function find(n){if(n?.type==='form')return n;for(const c of [n?.props?.children].flat()){const result=c&&find(c);if(result)return result}}const form=find(tree);await(form.props.onSubmit?form.props.onSubmit({preventDefault(){},currentTarget:{}}):form.props.action(new Map()));assert.equal(states.at(-1),false,name);assert.ok(states.includes('Network unavailable'),name);}
});

test('verified banking configuration is idempotent and rejects unsafe setup links',async()=>{
 let writes=0;const env={BRANCH_ONBOARDING_URL:'javascript:alert(1)'};
 const api=load('lib/program-holder/payout-account.ts',{'server-only':{},'@/lib/secrets':{hydrateProcessEnv:async()=>{}}},{process:{env}});
 const ctx={user:{id:'holder'},holderId:'holder',db:dbFor(({operation})=>{if(operation!=='select')writes++;return{data:{user_id:'holder',payout_provider:'branch',payouts_enabled:true,transfers_enabled:true,verification_status:'active'},error:null}})};
 assert.equal((await api.configureProgramHolderPayoutAccount(ctx,'branch')).payoutsEnabled,true);assert.equal(writes,0);await assert.rejects(api.configureProgramHolderPayoutAccount(ctx,'paypal'),/verified payout provider/);assert.equal(await api.payoutProviderUrl('branch','onboard'),null);env.BRANCH_ONBOARDING_URL='https://pay.example/secure-invitation';assert.equal(await api.payoutProviderConfigured('branch'),true);
});

test('insurance exemption is account-specific',()=>{const api=load('lib/program-holder/onboarding-readiness.ts');assert.equal(api.requiredProgramHolderDocuments(false,{insurance_required:false}).some(d=>d.type==='insurance'),false);assert.equal(api.requiredProgramHolderDocuments(false,{}).some(d=>d.type==='insurance'),true);});

test('daily progress preserves totals above 48 and rejects clocks for another program',async()=>{
 for(const matching of [true,false]){let updated=[];const ctx={mode:'holder',holderId:'holder',programIds:['program'],db:dbFor(({table,operation,writes})=>{if(operation==='update'){updated.push([table,writes[0]]);return{error:null}}return{data:table==='program_enrollments'?{id:'enrollment',user_id:'s',program_id:'program',program_slug:'bookkeeping',status:'in_progress',progress_percent:30,total_hours_completed:120}:{id:'h',user_id:'s',program_slug:matching?'bookkeeping':'hvac',approval_status:'approved',work_date:'2026-10-01',accepted_hours:8},error:null}})};const api=load('apps/lms/app/api/program-holder/training-logs/route.ts',{'next/server':next,'@/lib/auth/require-program-holder':{requireProgramHolder:async()=>ctx}});const result=await api.POST({json:async()=>({enrollment_id:'11111111-1111-4111-8111-111111111111',hour_entry_id:'22222222-2222-4222-8222-222222222222',work_date:'2026-10-01',milestone:'Verified training',work_completed:'Completed assigned practice',skills_learned:'Demonstrated assigned skills',progress_percent:50,attested:'true'})});assert.equal(result.status,matching?200:400);if(matching)assert.equal(updated.find(([table])=>table==='program_enrollments')[1].total_hours_completed,120);else assert.equal(updated.length,0);}
});

test('invalid requested program fails before account creation or approval writes',async()=>{let writes=0;const db=dbFor(({table,operation})=>{if(operation!=='select')writes++;return{data:table==='profiles'?{id:'admin',role:'admin'}:table==='program_holder_applications'?{id:'a',email:'test@example.test',contact_name:'Test',organization_name:'Test',status:'pending',data:{requested_program_slugs:['unavailable']}}:[],error:null}});const api=load('apps/admin/app/api/program-holder/applications/[id]/approve/route.ts',{'next/server':next,'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'admin'}}})}})},'@/lib/supabase/admin':{requireAdminClient:async()=>db},'@/lib/logger':{logger:{error(){},warn(){}}},'@/lib/config/platform-config':{PLATFORM_DEFAULTS:{}}});assert.equal((await api.POST({}, {params:Promise.resolve({id:'a'})})).status,409);assert.equal(writes,0);});

test('regional call logging links only candidates authorized by the server workspace',async()=>{for(const eligible of [true,false]){let writes=[];const db=dbFor(({operation,filters,writes:values})=>{if(operation!=='select')writes.push({operation,filters,values});return{data:operation==='insert'?{id:'actual-roster',status:'applied'}:null,error:null}});const api=load('apps/lms/app/api/program-holder/call-log/route.ts',{'next/server':next,'@/lib/auth/require-program-holder':{requireProgramHolder:async()=>({mode:'holder',holderId:'holder',programIds:['program'],user:{id:'coordinator'},db})},'@/lib/program-holder/workspace':{getProgramHolderWorkspace:async()=>({applicants:eligible?[{id:'a',application_id:'a',regional_application_id:'a',program_id:'program',applicant_name:'Test'}]:[]})}});assert.equal((await api.POST({json:async()=>({program_holder_student_id:'a',regional_application_id:'a',outcome:'no_answer'})})).status,eligible?200:404);if(eligible)assert.ok(writes.find(w=>w.operation==='update').filters.some(([k,v])=>k==='id'&&v==='actual-roster'));else assert.equal(writes.length,0);}});

test('pending approval cannot enter career feed, career detail or phone', async () => {
 for (const path of ['career/page.tsx','career/[id]/page.tsx','phone/page.tsx']) {
  let reads=0;
  const page=load(`apps/lms/app/program-holder/${path}`, {
   '@/lib/auth/require-program-holder':{requireProgramHolder:async()=>{throw Error('pending-approval')}},
   '@/lib/data/jobs':{getActiveJobs:async()=>{reads++;return[]},getJobById:async()=>{reads++;return null}},
  });
  await assert.rejects(page.default({params:Promise.resolve({id:'11111111-1111-4111-8111-111111111111'})}),/pending-approval/);
  assert.equal(reads,0);
 }
});

test('career detail distinguishes unavailable records from database failures', async () => {
 for (const failed of [true,false]) {
  const api=load('lib/data/jobs.ts',{
   '@/lib/supabase/public':{createPublicClient:()=>dbFor(()=>({data:null,error:failed?{message:'offline'}:null}))},
   '@/lib/logger':{logger:{error(){}}},
  });
  if(failed)await assert.rejects(api.getJobById('id',{throwOnError:true}),/temporarily unavailable/);
  else assert.equal(await api.getJobById('id',{throwOnError:true}),null);
 }
});


test('provider activation racing with setup cannot be overwritten', async () => {
 let holderWrites=0, updateFilters=[];
 const db=dbFor(({table,operation,filters})=>{
  if(table==='program_holders')holderWrites++;
  if(operation==='update'){updateFilters=filters;return {data:null,error:null};}
  return {data:{user_id:'u',payout_provider:'paypal',payouts_enabled:false,transfers_enabled:false},error:null};
 });
 const api=load('lib/program-holder/payout-account.ts',{'server-only':{},'@/lib/secrets':{hydrateProcessEnv:async()=>{}}});
 await assert.rejects(api.configureProgramHolderPayoutAccount({user:{id:'u'},holderId:'h',db},'branch'),/changed during setup/);
 assert.equal(holderWrites,0);
 for(const [key,value] of [['payouts_enabled',false],['transfers_enabled',false],['payout_provider','paypal']])assert.ok(updateFilters.some(([k,v])=>k===key&&v===value));
});


test('a profile backlink cannot authorize another holder owner', async () => {
 for(const owner of ['user','someone-else',null]){
  const db=dbFor(({table})=>({data:table==='program_holder_programs'?[]:{user_id:owner,status:'active',approved_at:'2026-10-01',features:{}},error:null}));
  const api=load('lib/auth/require-program-holder.ts',{
   '@/lib/supabase/admin':{requireAdminClient:async()=>db},
   'next/navigation':{redirect:url=>{throw Error(url)}},
   '@/lib/auth/portal-access':{requirePortalAccess:async()=>({user:{id:'user'},profile:{id:'user',role:'program_holder',program_holder_id:'linked'},isPlatformAdmin:false})},
   '@/lib/admin/portal-preview':{resolvePortalPreviewSubject:async()=>({previewing:false})},
  });
  if(owner==='user')assert.equal((await api.requireProgramHolder()).holderId,'linked');
  else await assert.rejects(api.requireProgramHolder(),/unauthorized/);
 }
});

test('communications reject suspended, inactive and missing profiles before loading phone credentials', async () => {
 for(const state of ['active','suspended','inactive','missing','profile-error','roles-error','holder-pending','holder-terminated','holder-error']){
  let phoneReads=0;
  const db=dbFor(({table})=>{
   if(table==='communication_extensions')phoneReads++;
   return {data:table==='profiles'?(state==='missing'?null:{id:'user',role:'program_holder',is_active:state!=='inactive',suspended:state==='suspended'}):table==='user_roles'?[]:table==='program_holders'?{status:'active',approved_at:state==='holder-pending'?null:'2026-10-01',terminated_at:state==='holder-terminated'?'2026-10-27':null}:null,error:(state==='profile-error'&&table==='profiles')||(state==='roles-error'&&table==='user_roles')||(state==='holder-error'&&table==='program_holders')?{message:'Unavailable'}:null};
  });
  const api=load('lib/communications/actor.ts',{
   'server-only':{},
   '@/lib/supabase/admin':{requireAdminClient:async()=>db},
   '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'user'}}})}})},
   '@/lib/admin/portal-preview':{resolvePortalPreviewSubject:async()=>({previewing:false})},
   '@/lib/rbac/role-matrix':{normalizeRoles:values=>values.filter(Boolean)},
  });
  if(state==='active'){assert.equal((await api.requireCommunicationActor()).user.id,'user');assert.equal(phoneReads,1);}
  else {await assert.rejects(api.requireCommunicationActor(),/COMMUNICATIONS_(FORBIDDEN|LOOKUP_UNAVAILABLE)/);assert.equal(phoneReads,0);}
 }
});
