import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
const jsx = {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
function load(path,mocks={},globals={}) {
 const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const result=ts.transpileModule(source,{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
 const scope={exports:{},require:n=>mocks[n]??(n==='@/lib/program-holder/testing-report'?load('lib/program-holder/testing-report.ts'):undefined)??(n==='@/lib/program-holder/recruiting-access'?load('lib/program-holder/recruiting-access.ts'):undefined)??(n==='@/lib/program-holder/profile-photo'?{resolveProgramHolderPhoto:async(_db,profile)=>profile.avatar_url||null}:undefined)??(n==='react/jsx-runtime'?jsx:{}),URL,Set,Map,Date,Error,process:{env:{}},...globals};vm.runInNewContext(result.outputText,scope);return scope.exports;
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
 for(const name of ['ProgramHolderDocumentUpload','ProgramHolderAcknowledgements','ProgramHolderNotificationPreferences','ProgramHolderStudentCloseoutForm','ProgramHolderTrainingLogForm']){let states=[];const react={useState:v=>[v,n=>states.push(n)]};const exports=load(`components/program-holder/${name}.tsx`,{'react':react,'@/lib/program-holder/training-milestones':load('lib/program-holder/training-milestones.ts'),'next/navigation':{useRouter:()=>({refresh(){}})},'@/lib/partners/enchanted-hearts':{ENCHANTED_HEARTS:{programs:[]},formatUsd:()=>''}},{fetch:async()=>{throw Error('Network unavailable')},FormData:class{get(){return ''}},window:{setTimeout(){}}});const tree=exports[name]({enrollments:[{id:'e'}],programs:[],verifiedHours:[],phone:''});function find(n){if(n?.type==='form')return n;for(const c of [n?.props?.children].flat()){const result=c&&find(c);if(result)return result}}const form=find(tree);await(form.props.onSubmit?form.props.onSubmit({preventDefault(){},currentTarget:{}}):form.props.action(new Map()));assert.equal(states.at(-1),false,name);assert.ok(states.includes('Network unavailable'),name);}
});

test('verified banking configuration is idempotent and rejects unsafe setup links',async()=>{
 let writes=0;const env={BRANCH_ONBOARDING_URL:'javascript:alert(1)'};
 const api=load('lib/program-holder/payout-account.ts',{'server-only':{},'@/lib/secrets':{hydrateProcessEnv:async()=>{}}},{process:{env}});
 const ctx={user:{id:'holder'},holderId:'holder',db:dbFor(({operation})=>{if(operation!=='select')writes++;return{data:{user_id:'holder',payout_provider:'branch',payouts_enabled:true,transfers_enabled:true,verification_status:'active'},error:null}})};
 assert.equal((await api.configureProgramHolderPayoutAccount(ctx,'branch')).payoutsEnabled,true);assert.equal(writes,0);await assert.rejects(api.configureProgramHolderPayoutAccount(ctx,'paypal'),/verified payout provider/);assert.equal(await api.payoutProviderUrl('branch','onboard'),null);env.BRANCH_ONBOARDING_URL='https://pay.example/secure-invitation';assert.equal(await api.payoutProviderConfigured('branch'),true);
});

test('insurance exemption is account-specific',()=>{const api=load('lib/program-holder/onboarding-readiness.ts');assert.equal(api.requiredProgramHolderDocuments(false,{insurance_required:false}).some(d=>d.type==='insurance'),false);assert.equal(api.requiredProgramHolderDocuments(false,{}).some(d=>d.type==='insurance'),true);});

test('daily progress preserves totals above 48 and rejects clocks for another program',async()=>{
 for(const matching of [true,false]){let updated=[];const ctx={mode:'holder',holderId:'holder',programIds:['program'],db:dbFor(({table,operation,writes})=>{if(operation==='update'){updated.push([table,writes[0]]);return{error:null}}return{data:table==='program_enrollments'?{id:'enrollment',user_id:'s',program_id:'program',program_slug:'bookkeeping',status:'in_progress',progress_percent:30,total_hours_completed:120}:{id:'h',user_id:'s',program_slug:matching?'bookkeeping':'hvac',approval_status:'approved',work_date:'2026-10-01',accepted_hours:8},error:null}})};const api=load('apps/lms/app/api/program-holder/training-logs/route.ts',{'next/server':next,'@/lib/auth/require-program-holder':{requireProgramHolder:async()=>ctx},'@/lib/program-holder/training-milestones':load('lib/program-holder/training-milestones.ts')});const result=await api.POST({json:async()=>({enrollment_id:'11111111-1111-4111-8111-111111111111',hour_entry_id:'22222222-2222-4222-8222-222222222222',work_date:'2026-10-01',milestone:'Guided practice and skill development',work_completed:'Completed assigned practice',skills_learned:'Demonstrated assigned skills',progress_percent:50,attested:'true'})});assert.equal(result.status,matching?200:400);if(matching)assert.equal(updated.find(([table])=>table==='program_enrollments')[1].total_hours_completed,120);else assert.equal(updated.length,0);}
});

test('invalid requested program fails before account creation or approval writes',async()=>{let writes=0;const db=dbFor(({table,operation})=>{if(operation!=='select')writes++;return{data:table==='profiles'?{id:'admin',role:'admin'}:table==='program_holder_applications'?{id:'a',email:'test@example.test',contact_name:'Test',organization_name:'Test',status:'pending',data:{requested_program_slugs:['unavailable']}}:[],error:null}});const api=load('apps/admin/app/api/program-holder/applications/[id]/approve/route.ts',{'next/server':next,'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'admin'}}})}})},'@/lib/supabase/admin':{requireAdminClient:async()=>db},'@/lib/logger':{logger:{error(){},warn(){}}},'@/lib/config/platform-config':{PLATFORM_DEFAULTS:{}}});assert.equal((await api.POST({}, {params:Promise.resolve({id:'a'})})).status,409);assert.equal(writes,0);});

test('regional call logging links only candidates authorized by the server workspace',async()=>{for(const eligible of [true,false]){let writes=[];const db=dbFor(({table,operation,filters,writes:values})=>{if(operation!=='select')writes.push({operation,filters,values});return{data:operation==='insert'?{id:'actual-roster',status:'applied'}:table==='program_holders'&&operation==='select'?{features:{recruiting_enabled:true}}:null,error:null}});const api=load('apps/lms/app/api/program-holder/call-log/route.ts',{'next/server':next,'@/lib/auth/require-program-holder':{requireProgramHolder:async()=>({mode:'holder',holderId:'holder',programIds:['program'],user:{id:'coordinator'},db})},'@/lib/program-holder/workspace':{getProgramHolderWorkspace:async()=>({applicants:eligible?[{id:'a',application_id:'a',regional_application_id:'a',program_id:'program',applicant_name:'Test'}]:[]})}});assert.equal((await api.POST({json:async()=>({program_holder_student_id:'a',regional_application_id:'a',outcome:'no_answer'})})).status,eligible?200:404);if(eligible)assert.ok(writes.find(w=>w.operation==='update').filters.some(([k,v])=>k==='id'&&v==='actual-roster'));else assert.equal(writes.length,0);}});

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

test('QuickBooks invitations reject lookalike hosts and resolve only the authenticated payout row',async()=>{
 const db=dbFor(({table,filters})=>{assert.equal(table,'program_holder_payouts');assert.ok(filters.some(([k,v])=>k==='user_id'&&v==='owner'));return{data:{notes:JSON.stringify({quickbooks_invitation_url:'https://workforce.intuit.com/invite/private-token'})},error:null}});
 const api=load('lib/program-holder/payout-account.ts',{'server-only':{},'@/lib/secrets':{hydrateProcessEnv:async()=>{}}});
 for(const bad of ['https://intuit.com.evil.example/invite','https://evil.example/intuit.com','http://intuit.com/invite','https://user:password@intuit.com/invite','javascript:alert(1)'])assert.equal(api.quickBooksInvitationUrl(bad),null);
 assert.equal(await api.payoutProviderUrl('quickbooks','onboard',{user:{id:'owner'},holderId:'h',db}),'https://workforce.intuit.com/invite/private-token');
 assert.equal(api.payoutSetupNotes('Existing audit note').previous_notes,'Existing audit note');
});

test('PayPal banking settings use the official wallet without a fabricated organization URL',async()=>{
 const api=load('lib/program-holder/payout-account.ts',{'server-only':{},'@/lib/secrets':{hydrateProcessEnv:async()=>{}}},{process:{env:{PAYPAL_CLIENT_ID:'configured',PAYPAL_CLIENT_SECRET:'configured',PAYPAL_ENVIRONMENT:'production'}}});
 assert.equal(await api.payoutProviderConfigured('paypal'),true);
 assert.equal(await api.payoutProviderUrl('paypal','onboard'),'https://www.paypal.com/myaccount/money');
});

test('saving a PayPal destination preserves payment locks and requires later review',async()=>{
 let saved;
 const db=dbFor(({operation,writes})=>{if(operation==='update'){saved=writes[0];return{data:{user_id:'owner'},error:null}}return{data:{user_id:'owner',payout_provider:'branch',payouts_enabled:false,transfers_enabled:false},error:null}});
 const api=load('lib/program-holder/payout-account.ts',{'server-only':{},'@/lib/secrets':{hydrateProcessEnv:async()=>{}}});
 await api.saveProgramHolderPayPalRecipient({user:{id:'owner'},holderId:'h',db},' Person@Example.com ');
 assert.equal(saved.provider_recipient_id,'person@example.com');assert.equal(saved.verification_status,'pending');assert.equal(saved.payouts_enabled,false);assert.equal(saved.transfers_enabled,false);
 await assert.rejects(api.saveProgramHolderPayPalRecipient({user:{id:'owner'},holderId:'h',db},'not-an-email'),/valid PayPal email/);
});

test('verified payout destinations cannot be replaced by a new PayPal email',async()=>{
 let writes=0;const db=dbFor(({operation})=>{if(operation!=='select')writes++;return{data:{payout_provider:'paypal',provider_recipient_id:'old@example.com',payouts_enabled:true,transfers_enabled:true},error:null}});
 const api=load('lib/program-holder/payout-account.ts',{'server-only':{},'@/lib/secrets':{hydrateProcessEnv:async()=>{}}});
 await assert.rejects(api.saveProgramHolderPayPalRecipient({user:{id:'owner'},holderId:'h',db},'new@example.com'),/verified payout destination/);assert.equal(writes,0);
});

test('compliance lookup errors block release but leave banking setup accessible',async()=>{
 const api=load('apps/lms/app/api/program-holder/payouts/route.ts',{'next/server':next,'@/lib/auth/require-program-holder':{requireProgramHolder:async()=>({mode:'holder',holderId:'h',db:{}})},'@/lib/program-holder/payout-account':{getProgramHolderPayoutAccount:async()=>({provider:'quickbooks'})},'@/lib/program-holder/onboarding-readiness':{getProgramHolderPaymentReadiness:async()=>{throw Error('offline')}}});
 const result=await api.GET();assert.equal(result.status,200);assert.equal(result.body.provider,'quickbooks');assert.equal(result.body.onboardingReady,false);assert.ok(result.body.missingRequirements.length);
});

test('QuickBooks requests do not report an invitation delivered when notification writes fail',async()=>{
 const api=load('apps/lms/app/api/program-holder/payouts/route.ts',{'next/server':next,'@/lib/api/withRateLimit':{applyRateLimit:async()=>null},'@/lib/auth/require-program-holder':{requireProgramHolder:async()=>({mode:'holder',holderId:'h',user:{id:'owner'},db:dbFor(()=>({error:{message:'offline'}}))})},'@/lib/program-holder/payout-account':{configureProgramHolderPayoutAccount:async()=>({})}});
 const result=await api.POST({json:async()=>({provider:'quickbooks',action:'request_quickbooks'})});assert.equal(result.status,503);assert.equal(result.body.ok,undefined);
});

test('administrator previews cannot save PayPal destinations',async()=>{
 let writes=0;const api=load('apps/lms/app/api/program-holder/payouts/route.ts',{'next/server':next,'@/lib/api/withRateLimit':{applyRateLimit:async()=>null},'@/lib/auth/require-program-holder':{requireProgramHolder:async()=>({mode:'preview'})},'@/lib/program-holder/payout-account':{saveProgramHolderPayPalRecipient:async()=>{writes++}}});assert.equal((await api.POST({json:async()=>({action:'save_paypal',email:'x@example.com',confirm:true})})).status,403);assert.equal(writes,0);
});


test('QuickBooks payment recording refuses missing account mappings instead of guessing a bank',async()=>{
 let calls=0;const api=load('lib/integrations/quickbooks-contractor-payment.ts',{'server-only':{},'node:crypto':{createHash},'@/lib/logger':{logger:{error(){}}},'./quickbooks-client':{assertQuickBooksProductionEnvironment(){},loadQuickBooksConfig:async()=>({}),quickBooksRequest:async()=>{calls++}}});
 const result=await api.recordContractorPaymentInQuickBooks(dbFor(()=>({data:[],error:null})),{amountCents:10000,providerTransferId:'real-transfer',contractorName:'Test',enrollmentId:'e',memo:'Test'});assert.equal(result.synced,false);assert.match(result.reason,/Select the payout clearing/);assert.equal(calls,0);
});

test('QuickBooks recording retries share the provider transfer request ID',async()=>{
 const requests=[];const api=load('lib/integrations/quickbooks-contractor-payment.ts',{'server-only':{},'node:crypto':{createHash},'@/lib/logger':{logger:{error(){}}},'./quickbooks-client':{assertQuickBooksProductionEnvironment(){},loadQuickBooksConfig:async()=>({}),quickBooksRequest:async(_db,_config,path,options)=>{requests.push({path,options});return path.startsWith('query')?{QueryResponse:{Vendor:[{Id:'vendor',PrimaryEmailAddr:{Address:'test@example.com'}}]}}:{Purchase:{Id:'record'}}}}});
 const db=dbFor(()=>({data:[{key:'QB_PAYOUT_BANK_ACCOUNT_ID',value:'bank'},{key:'QB_CONTRACTOR_EXPENSE_ACCOUNT_ID',value:'expense'}],error:null}));
 const input={amountCents:10000,providerTransferId:'real-transfer',contractorName:'Test',contractorEmail:'test@example.com',enrollmentId:'e',memo:'Test'};
 for(let i=0;i<2;i++)assert.equal((await api.recordContractorPaymentInQuickBooks(db,input)).synced,true);
 const writes=requests.filter(r=>r.options?.method==='POST');assert.equal(writes.length,2);assert.equal(writes[0].path,writes[1].path);assert.match(writes[0].path,/purchase\?requestid=efh-payout-/);assert.equal(JSON.parse(writes[0].options.body).AccountRef.value,'bank');
});

test('staff roles cannot verify banking or attach invitation tokens',async()=>{
 let reads=0;const api=load('apps/admin/app/api/admin/program-holders/[id]/banking/route.ts',{'next/server':next,'@/lib/api/withRateLimit':{applyRateLimit:async()=>null},'@/lib/admin/guards':{apiRequireAdmin:async()=>({effectiveRoles:['staff']})},'@/lib/supabase/admin':{requireAdminClient:async()=>{reads++;return{}}}});
 assert.equal((await api.POST({json:async()=>({action:'confirm_setup',confirmed:true})},{params:Promise.resolve({id:'h'})})).status,403);assert.equal(reads,0);
});

test('QuickBooks invitations are attached to private payout notes while preserving previous notes',async()=>{
 let written;
 const service=load('lib/program-holder/payout-account.ts',{'server-only':{}});
 const db=dbFor(({table,operation,writes,filters})=>{
  if(table==='program_holders')return{data:{user_id:'owner'},error:null};
  if(operation==='update'){written=writes[0];assert.ok(filters.some(([k,v])=>k==='user_id'&&v==='owner'));assert.ok(filters.some(([k,v])=>k==='updated_at'&&v==='snapshot'));return{data:{user_id:'owner'},error:null};}
  return{data:{notes:'Existing audit record',updated_at:'snapshot'},error:null};
 });
 const api=load('apps/admin/app/api/admin/program-holders/[id]/banking/route.ts',{'next/server':next,'@/lib/api/withRateLimit':{applyRateLimit:async()=>null},'@/lib/admin/guards':{apiRequireAdmin:async()=>({id:'admin',effectiveRoles:['admin']})},'@/lib/supabase/admin':{requireAdminClient:async()=>db},'@/lib/program-holder/payout-account':service});
 const result=await api.POST({json:async()=>({action:'save_invitation',url:'https://workforce.intuit.com/invite/private'})},{params:Promise.resolve({id:'h'})});assert.equal(result.status,200);assert.equal(JSON.parse(written.notes).previous_notes,'Existing audit record');assert.equal(written.features,undefined);assert.equal(written.payouts_enabled,undefined);
});

test('banking review requires explicit administrator confirmation before enabling payments',async()=>{
 let writes=0;const db=dbFor(({operation})=>{if(operation!=='select')writes++;return{data:{user_id:'owner'},error:null}});
 const api=load('apps/admin/app/api/admin/program-holders/[id]/banking/route.ts',{'next/server':next,'@/lib/api/withRateLimit':{applyRateLimit:async()=>null},'@/lib/admin/guards':{apiRequireAdmin:async()=>({id:'admin',effectiveRoles:['admin']})},'@/lib/supabase/admin':{requireAdminClient:async()=>db}});
 assert.equal((await api.POST({json:async()=>({action:'confirm_setup',provider:'paypal',reference:'review-ref'})},{params:Promise.resolve({id:'h'})})).status,400);assert.equal(writes,0);
});

test('contractor provisioning links existing contractors and creates new ones without banking or payment writes',async()=>{
 for(const existing of [false,true]) {
  const writes=[],requests=[];const holder={id:'holder',organization_name:'Business',contact_email:'owner@example.com',status:'approved_pending_mou',features:{}};
  const db=dbFor(q=>{if(q.operation!=='select')writes.push(q);return {data:q.table==='program_holders'?holder:null,error:null}});
  // This fixture captures the canonical mapping upsert separately from payout tables.
  const original=db.from.bind(db);db.from=table=>{const q=original(table);q.upsert=value=>{writes.push({table,value});return Promise.resolve({error:null})};return q};
  const vendor={Id:'vendor',Vendor1099:true,PrimaryEmailAddr:{Address:'owner@example.com'}};
  const api=load('lib/integrations/quickbooks-program-holder-contractor.ts',{'server-only':{},'node:crypto':{createHash},'./quickbooks-client':{loadQuickBooksConfig:async()=>({realmId:'realm'}),assertQuickBooksProductionEnvironment(){},quickBooksRequest:async(_db,_config,path,options)=>{requests.push({path,options});return path.startsWith('query')?{QueryResponse:{Vendor:existing?[vendor]:[]}}:{Vendor:vendor}}}});
  assert.equal((await api.ensureProgramHolderQuickBooksContractor(db,'holder')).linked,true);
  assert.equal(requests.filter(r=>r.options).length,existing?0:1);
  if(!existing){const body=JSON.parse(requests[1].options.body);assert.equal(body.Vendor1099,true);assert.deepEqual(Object.keys(body).sort(),['CompanyName','DisplayName','PrimaryEmailAddr','Vendor1099']);assert.match(requests[1].path,/requestid=efh-holder-/);}
  assert.equal(writes.length,1);assert.equal(writes[0].table,'app_settings');assert.equal(JSON.parse(writes[0].value.value).vendorId,'vendor');
 }
});

test('contractor provisioning excludes test and inactive holders before contacting QuickBooks',async()=>{
 for(const holder of [{organization_name:'[QA] Company',status:'active'},{organization_name:'Business',status:'inactive'},{organization_name:'Business',status:'active',contact_email:'test@example.invalid'}]) {
  let providerCalls=0;const api=load('lib/integrations/quickbooks-program-holder-contractor.ts',{'node:crypto':{createHash},'./quickbooks-client':{loadQuickBooksConfig:async()=>{providerCalls++;throw Error('Must not connect')}}});
  const result=await api.ensureProgramHolderQuickBooksContractor(dbFor(()=>({data:holder,error:null})),'holder');assert.equal(result.linked,false);assert.equal(providerCalls,0);
 }
});

test('contractor contact conflicts fail closed without creating a duplicate',async()=>{
 const api=load('lib/integrations/quickbooks-program-holder-contractor.ts',{'node:crypto':{createHash},'./quickbooks-client':{loadQuickBooksConfig:async()=>({realmId:'realm'}),assertQuickBooksProductionEnvironment(){},quickBooksRequest:async(_db,_config,path,options)=>{assert.equal(options,undefined);return{QueryResponse:{Vendor:[{Id:'other',PrimaryEmailAddr:{Address:'other@example.com'}}]}}}}});
 const db=dbFor(q=>({data:q.table==='program_holders'?{organization_name:'Business',contact_email:'owner@example.com',status:'active'}:null,error:null}));await assert.rejects(api.ensureProgramHolderQuickBooksContractor(db,'holder'),/contact does not match/);
});

test('contractor mapping is company scoped and cannot mark banking verified',async()=>{
 const db=dbFor(q=>({data:q.table==='program_holders'?{organization_name:'Business',contact_email:'owner@example.com',status:'active'}:{value:JSON.stringify({realmId:'realm',vendorId:'vendor'})},error:null}));
 const api=load('lib/integrations/quickbooks-program-holder-contractor.ts',{'./quickbooks-client':{loadQuickBooksConfig:async()=>({realmId:'realm'}),assertQuickBooksProductionEnvironment(){},quickBooksRequest:async()=>{throw Error('Already mapped')}}});assert.equal((await api.ensureProgramHolderQuickBooksContractor(db,'holder')).vendorId,'vendor');
 const source=readFileSync(new URL('../lib/integrations/quickbooks-program-holder-contractor.ts',import.meta.url),'utf8');assert.doesNotMatch(source,/payouts_enabled|transfers_enabled|verification_status|sendEmail|TaxIdentifier/);
});

test('QuickBooks payment retries use the provider requestid and require a returned payment ID', async()=>{
 for(const providerConfirmed of [false,true]) {
  const paths=[];let writes=0;let failSave=true;
  const db=dbFor(q=>{if(q.operation==='update'){writes++;return{error:failSave?{message:'temporarily unavailable'}:null}}return{data:{id:'invoice',provider_invoice_id:'qb-invoice',provider_payload:{CustomerRef:{value:'customer'},TotalAmt:75}},error:null}});
  const api=load('lib/billing/providers/quickbooks.ts',{'node:crypto':{createHash},'@/lib/integrations/quickbooks-client':{loadQuickBooksConfig:async()=>({}),quickBooksRequest:async(_db,_config,path)=>{paths.push(path);return providerConfirmed?{Payment:{Id:'paid-record'}}:{}}}});
  const input={idempotencyKey:'payment-key',billingScheduleId:'schedule',collectionProvider:'paypal',providerPaymentId:'capture',paidAt:'2026-10-27T12:00:00Z'};
  await assert.rejects(api.recordQuickBooksExternalPayment(db,input),providerConfirmed?/local ledger update failed/:/did not confirm/);
  failSave=false;
  if(providerConfirmed){assert.equal((await api.recordQuickBooksExternalPayment(db,input)).quickBooksPaymentId,'paid-record');assert.equal(paths[0],paths[1]);}else assert.equal(writes,0);
  assert.match(paths[0],/^payment\?requestid=[a-f0-9]{50}$/);
 }
});

test('pause/cancel changes automatic collection in PayPal before updating local records', async()=>{
 for(const next of ['paused','canceled']) {
  const calls=[];let providerState='ACTIVE';
  const db=dbFor(q=>{if(q.operation==='update'){calls.push('save');assert.equal(providerState,next==='paused'?'SUSPENDED':'CANCELLED');return{data:{id:'schedule'},error:null}}return{data:{id:'schedule',status:'active',collection_mode:'automatic',collection_provider:'paypal',provider_subscription_id:'subscription',updated_at:'revision'},error:null}});
  const api=load('lib/billing/change-schedule-status.ts',{'node:crypto':{createHash},'@/lib/integrations/paypal-client':{payPalRequest:async(path,options)=>{calls.push(options.method);if(options.method==='POST')providerState=next==='paused'?'SUSPENDED':'CANCELLED';return{status:providerState}}}});
  assert.equal((await api.changeBillingScheduleStatus(db,'schedule',next)).ok,true);assert.deepEqual(calls,['GET','POST','GET','save']);
 }
});

test('provider failures and missing release cannot falsely pause or resume billing', async()=>{
 for(const next of ['active','paused']) {
  let writes=0;let providerCalls=0;
  const db=dbFor(q=>{if(q.operation==='update')writes++;return{data:q.table==='billing_migration_authorizations'?null:{id:'schedule',collection_mode:'automatic',collection_provider:'paypal',provider_subscription_id:'subscription',updated_at:'revision'},error:null}});
  const api=load('lib/billing/change-schedule-status.ts',{'./recurring-release':{hasVerifiedRecurringRelease:async()=>false},'node:crypto':{createHash},'@/lib/integrations/paypal-client':{payPalRequest:async()=>{providerCalls++;throw Error('Provider unavailable')}}});
  await assert.rejects(api.changeBillingScheduleStatus(db,'schedule',next),next==='active'?/approved signed/:/Provider unavailable/);assert.equal(writes,0);assert.equal(providerCalls,next==='active'?0:1);
 }
});

test('billing history queries the actual organization relationship and surfaces lookup failures',async()=>{
 let organizationQuery=false;
 const db=dbFor(q=>{if(q.table==='organization_subscriptions'){assert.match(q.columns,/organizations\(name,slug\)/);assert.doesNotMatch(q.columns,/tenants\(/);organizationQuery=true;return{data:null,error:{message:'Unavailable'}}}return{data:[],error:null}});
 const page=load('apps/admin/app/billing/subscriptions/page.tsx',{'@/lib/auth/require-role':{requireRole:async()=>{}},'@/lib/supabase/admin':{requireAdminClient:async()=>db}});
 const tree=await page.default();assert.equal(organizationQuery,true);assert.equal(tree.props.children.flat().find(x=>x?.props?.role==='alert')?.props.role,'alert');
});
