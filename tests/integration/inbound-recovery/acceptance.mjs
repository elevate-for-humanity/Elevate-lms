import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { randomUUID, createHash } from 'node:crypto';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
let db;
if (process.env.INBOUND_TEST_PGLITE === '1') {
  const { PGlite } = await import('@electric-sql/pglite');
  db = new PGlite();
} else {
  if (process.env.PGDATABASE !== 'efh_inbound_test') throw Error('Isolated inbound test database required');
  const execute = async sql => (await promisify(execFile)('psql', ['-X','-v','ON_ERROR_STOP=1','-t','-A','-c',sql], {encoding:'utf8'})).stdout;
  const literal = value => value === null ? 'null' : typeof value === 'boolean' ? String(value) :
    "'" + (typeof value === 'object' ? JSON.stringify(value) : String(value)).replaceAll("'","''") + "'";
  db = {
    exec: async sql => execute(sql),
    query: async (sql, values = []) => {
      const substituted = sql.replace(/\$(\d+)/g, (_, index) => literal(values[Number(index)-1]));
      if (/^\s*(insert|update|delete)\b/i.test(substituted)) {
        if (!/\breturning\b/i.test(substituted)) { await execute(substituted); return {rows:[]}; }
        return {rows:JSON.parse(await execute("with result as ("+substituted+") select coalesce(json_agg(result),'[]'::json) from result"))};
      }
      return { rows: JSON.parse(await execute("select coalesce(json_agg(result),'[]'::json) from ("+substituted+") result")) };
    },
  };
}
await db.exec("create role anon;create role authenticated;create role service_role bypassrls;");
await db.exec("create table webhook_events_processed(id uuid primary key default gen_random_uuid(),event_id text not null,provider text not null,event_type text not null,status text not null,received_at timestamptz not null default now(),processed_at timestamptz,error_message text,metadata jsonb default '{}',unique(provider,event_id));");
const oldGuard = readFileSync(new URL('../../../supabase/migrations/20260313900007_webhook_health_monitor.sql', import.meta.url),'utf8');
await db.exec(oldGuard.slice(oldGuard.indexOf('CREATE OR REPLACE FUNCTION webhook_event_lifecycle_guard()')));
await db.exec(readFileSync(new URL('../../../supabase/migrations/20261114083209_recover_inbound_delivery_leases.sql',import.meta.url),'utf8'));
async function rpc(name,args) {
 const cols=Object.keys(args), values=Object.values(args);
 try {
  const result=await db.query('select '+name+'('+cols.map((key,i)=>key+'=> $'+(i+1)).join(',')+') as result',values);
  return {data:result.rows[0]?.result,error:null};
 } catch(error) {return {data:null,error};}
}
const supabase = { rpc,
 from: () => ({select:()=>({eq:(_k,provider)=>({eq:(_key,id)=>({
  maybeSingle:async()=>({data:(await db.query('select status,error_message from webhook_events_processed where provider=$1 and event_id=$2',[provider,id])).rows[0]||null,error:null})
 })})})})
};
function moduleContext(path,extra={}) {
 let source=readFileSync(new URL('../../../'+path,import.meta.url),'utf8');
 source=source.replace(/^import .*;\n/gm,'').replace("await import('crypto')","{ createHash: cryptoCreateHash }");
 source=stripTypeScriptTypes(source).replace(/^export /gm,'');
 const context=vm.createContext({ randomUUID,createHash,cryptoCreateHash:createHash,Buffer,FormData,Request,Response,File,URL,URLSearchParams,
 requireAdminClient:async()=>supabase,logger:{info(){},warn(){},error(){}},process:{env:{}},console,...extra });
 vm.runInContext(source,context);
 return context;
}
const tracker=moduleContext('lib/webhooks/event-tracker.ts');
const parser=moduleContext('lib/email/sendgrid-inbound.ts');
async function claim(id,type='email.received') {
 const token=randomUUID();
 return {token,...await rpc('claim_inbound_webhook_event',{p_event_id:id,p_event_type:type,p_metadata:{},p_token:token})};
}
async function finish(id,token,status,retrySafe=false) {
 return rpc('finish_inbound_webhook_event',{p_event_id:id,p_token:token,p_status:status,p_error:status==='errored'?'transient':null,p_retry_safe:retrySafe});
}
test('errored storage delivery is reclaimed once, records its old receipt and completes',async()=>{
 const first=await claim('recover');assert.equal(first.data.state,'claimed');
 assert.equal((await finish('recover',first.token,'errored')).data,true);
 const [a,b]=await Promise.all([claim('recover'),claim('recover')]);
 const acquired=[a,b].filter(x=>x.data.state==='claimed');
 assert.equal(acquired.length,1);
 assert.equal((await finish('recover',first.token,'processed')).data,false);
 assert.equal((await finish('recover',acquired[0].token,'processed')).data,true);
 const row=(await db.query("select status,attempt_count,attempt_history from webhook_events_processed where event_id='recover'")).rows[0];
 assert.equal(row.status,'processed');assert.equal(row.attempt_count,2);
 assert.equal(row.attempt_history[0].status,'errored');
 assert.equal((await claim('recover')).data.state,'duplicate');
});
test('expired processing lease can be reclaimed while current owner is excluded',async()=>{
 const first=await claim('abandoned');
 // Control time by temporarily replacing clock_timestamp inside this isolated fixture.
 await db.exec("alter table webhook_events_processed disable trigger trg_webhook_event_lifecycle; update webhook_events_processed set lease_expires_at=now()-interval '1 minute' where event_id='abandoned'; alter table webhook_events_processed enable trigger trg_webhook_event_lifecycle;");
 const second=await claim('abandoned');assert.equal(second.data.state,'claimed');
 assert.equal((await finish('abandoned',first.token,'processed')).data,false);
 assert.equal((await finish('abandoned',second.token,'processed')).data,true);
});
test('forward barrier blocks ambiguous retry and permits only explicit rejected-send retry',async()=>{
 const a=await tracker.claimInboundForward('forward-message','owner@example.org');
 assert.equal(a.state,'claimed');
 assert.equal((await tracker.claimInboundForward('forward-message','owner@example.org')).state,'blocked');
 await tracker.finalizeWebhookEvent('sendgrid-inbound',a.eventId,'errored','Operation failed',{strict:true,leaseToken:a.leaseToken});
 assert.equal((await tracker.claimInboundForward('forward-message','owner@example.org')).state,'blocked');
 const b=await tracker.claimInboundForward('safe-forward','owner@example.org');
 await tracker.finalizeWebhookEvent('sendgrid-inbound',b.eventId,'errored','SendGrid rejected request (503)',{strict:true,leaseToken:b.leaseToken,retrySafe:true});
 const c=await tracker.claimInboundForward('safe-forward','owner@example.org');assert.equal(c.state,'claimed');
 await tracker.finalizeWebhookEvent('sendgrid-inbound',c.eventId,'processed',undefined,{strict:true,leaseToken:c.leaseToken});
 assert.equal((await tracker.claimInboundForward('safe-forward','owner@example.org')).state,'duplicate');
});
async function parsed(envelope) {
 const form=new FormData();
 form.set('from','Sender <sender@example.org>');form.set('to','admissions@elevateforhumanity.org');
 form.set('subject','Split delivery');form.set('text','Same original message');
 form.set('headers','Message-ID: <original-message@example.org>');
 form.set('envelope',JSON.stringify({to:envelope}));
 return parser.parseInboundEmail(new Request('https://test.invalid',{method:'POST',body:form}));
}
test('split and overlapping envelopes retain message identity but have distinct delivery claims',async()=>{
 const bcc=await parsed(['billing@elevateforhumanity.org']);
 const to=await parsed(['admissions@elevateforhumanity.org']);
 const overlap=await parsed(['billing@elevateforhumanity.org','admissions@elevateforhumanity.org']);
 const reordered=await parsed(['ADMISSIONS@ELEVATEFORHUMANITY.ORG','billing@elevateforhumanity.org']);
 assert.equal(bcc.eventId,to.eventId);assert.equal(to.eventId,overlap.eventId);
 assert.notEqual(bcc.deliveryId,to.deliveryId);assert.notEqual(to.deliveryId,overlap.deliveryId);
 assert.equal(overlap.deliveryId,reordered.deliveryId);
 const mailboxes=new Set();
 for(const message of [bcc,to,overlap,reordered,bcc]){
  const receipt=await tracker.claimWebhookEvent('sendgrid-inbound',message.deliveryId,'email.received',{}, {requireFinalizedDuplicate:true});
  if(!receipt.shouldProcess)continue;
  assert.equal(receipt.confident,true);
  for(const address of parser.inboundDeliveryRecipients(message))mailboxes.add(message.eventId+':'+address);
  await tracker.finalizeWebhookEvent('sendgrid-inbound',message.deliveryId,'processed',undefined,{strict:true,leaseToken:receipt.leaseToken});
 }
 assert.equal(mailboxes.size,2);
});
test('both actual handlers recover after first storage failure without duplicate forwarding',async()=>{
 for(const app of ['lms','marketing']){
  let attempts=0,sends=0;const copies=new Set();
  const ctx=moduleContext('apps/'+app+'/app/api/webhooks/sendgrid-inbound/route.ts',{
   hydrateProcessEnv:async()=>{},verifySendGridInboundRequest:async()=>({verified:true}),
   parseInboundEmail:async()=>({from:'sender@example.org',to:'admissions@elevateforhumanity.org',subject:'Retry',
    text:'body',html:'',replyTo:'sender@example.org',eventId:'stable-'+app,deliveryId:'delivery-'+app,envelopeRecipients:['admissions@elevateforhumanity.org'],attachments:[]}),
   claimWebhookEvent:tracker.claimWebhookEvent,finalizeWebhookEvent:tracker.finalizeWebhookEvent,claimInboundForward:tracker.claimInboundForward,
   storeInboundCommunicationEmail:async()=>{
    copies.add('admissions');attempts++;if(attempts===1)throw Error('billing dependency unavailable');
    copies.add('billing');return {stored:true,mailboxCount:2};
   },respondToParisMail:async()=>{},resolveForwardTarget:()=> 'owner@example.org',
   sendEmail:async()=>{sends++;return {success:true};},
   PLATFORM_DEFAULTS:{emailFromAddress:'info@example.org'},NextResponse:{json:(body,options)=>new Response(JSON.stringify(body),options)},
   withApiAudit:(_path,fn)=>fn,normalizeError:e=>e,getErrorContext:()=>({})
  });
  assert.equal((await ctx._POST(new Request('https://test.invalid'))).status,500);
  assert.equal((await ctx._POST(new Request('https://test.invalid'))).status,200);
  assert.equal((await ctx._POST(new Request('https://test.invalid'))).status,200);
  assert.equal(copies.size,2);assert.equal(attempts,2);assert.equal(sends,0);
 }
});

test('PARIS retries a failed reply claim without advancing the applicant interview twice',async()=>{
 let app={id:'app',program_interest:'barber',interview_completed:false,status:'pending',
  interview_responses:{email_interview:{started:true,current:0,answers:[]}}};
 let insertCount=0,sends=0;
 const records=[];
 const fakeDb={from:table=>{
  let selection='',updates,filters={};let inserting;
  const q={
   select:(value)=>{selection=value;return q;},eq:(key,value)=>{filters[key]=value;return q;},
   ilike:()=>q,in:()=>q,order:()=>q,limit:()=>q,
   update:value=>{updates=value;return q;},insert:value=>{inserting=value;return q;},
   maybeSingle:async()=>{
    if(table==='applications')return {data:app,error:null};
    if(filters.inbound_event_id?.endsWith(':paris-mail'))return {data:null,error:null};
    return {data:{id:'inbound',thread_id:'thread'},error:null};
   },
   single:async()=>{
    insertCount++;records.push(inserting);
    return insertCount===1?{data:null,error:{code:'57014'}}:{data:{id:'reply'},error:null};
   },
   then:resolve=>{
    if(table==='applications'&&updates)app={...app,...updates};
    return Promise.resolve(table==='communication_email_mailboxes'?{data:[{id:'box',address:'admissions@elevateforhumanity.org'}],error:null}:{data:null,count:2,error:null}).then(resolve);
   }
  };return q;
 }};
 const ctx=moduleContext('lib/email/paris-mail.ts',{
  requireAdminClient:async()=>fakeDb,notifyParisMailResult:async()=>{},
  sendEmail:async()=>{sends++;return {success:true};},
  parseEmailList:value=>[value],textToEmailHtml:value=>value,canParisRespond:()=>true,
  emailLikeLiteral:value=>value,inboundDeliveryRecipients:()=>['admissions@elevateforhumanity.org']
 });
 const message={eventId:'same-interview-answer',from:'applicant@example.org',text:'My answer',subject:'Application'};
 await assert.rejects(ctx.respondToParisMail(message),/reply claim/);
 assert.equal(app.interview_responses.email_interview.current,1);
 assert.equal(app.interview_responses.email_interview.answers.length,1);
 await ctx.respondToParisMail(message);
 assert.equal(app.interview_responses.email_interview.current,1);
 assert.equal(app.interview_responses.email_interview.answers.length,1);
 assert.equal(records[0].text_body,records[1].text_body);assert.equal(sends,1);
});

test('legacy errored and abandoned forwarding remains fenced while mailbox storage can recover',async()=>{
 for(const app of ['lms','marketing']){
  for(const legacyStatus of ['errored','processing']){
   const messageId='legacy-'+app+'-'+legacyStatus;
   await db.query("insert into webhook_events_processed(event_id,provider,event_type,status,metadata,received_at,error_message) values($1,'sendgrid-inbound','email.received',$2,'{}',now()-interval '1 hour','Unknown legacy outcome')",[messageId,legacyStatus]);
   const before=(await db.query('select * from webhook_events_processed where event_id=$1',[messageId])).rows[0];
   assert.equal((await tracker.claimInboundForward(messageId,'owner@example.org')).state,'blocked');
   let stored=false,sends=0;
   const ctx=moduleContext('apps/'+app+'/app/api/webhooks/sendgrid-inbound/route.ts',{
    hydrateProcessEnv:async()=>{},verifySendGridInboundRequest:async()=>({verified:true}),
    parseInboundEmail:async()=>({from:'sender@example.org',to:'admissions@elevateforhumanity.org',subject:'Old retry',
     text:'body',html:'',replyTo:'sender@example.org',eventId:messageId,deliveryId:messageId+'-envelope',
     envelopeRecipients:['admissions@elevateforhumanity.org'],attachments:[]}),
    claimWebhookEvent:tracker.claimWebhookEvent,finalizeWebhookEvent:tracker.finalizeWebhookEvent,claimInboundForward:tracker.claimInboundForward,
    storeInboundCommunicationEmail:async()=>({stored,mailboxCount:stored?1:0}),
    respondToParisMail:async()=>{},resolveForwardTarget:()=> 'owner@example.org',
    sendEmail:async()=>{sends++;return {success:true};},
    PLATFORM_DEFAULTS:{emailFromAddress:'info@example.org'},NextResponse:{json:(body,options)=>new Response(JSON.stringify(body),options)},
    withApiAudit:(_path,fn)=>fn,normalizeError:e=>e,getErrorContext:()=>({})
   });
   // No mailbox copy is possible yet: uncertain old external sends cannot replay.
   assert.equal((await ctx._POST(new Request('https://test.invalid'))).status,500);
   assert.equal(sends,0);
   // Once mailbox storage recovers, the retry can complete without forwarding.
   stored=true;
   assert.equal((await ctx._POST(new Request('https://test.invalid'))).status,200);
   assert.equal(sends,0);
   const after=(await db.query('select * from webhook_events_processed where event_id=$1',[messageId])).rows[0];
   assert.deepEqual(after,before);
   const receipt=(await db.query('select status from webhook_events_processed where event_id=$1',[messageId+'-envelope'])).rows[0];
   assert.equal(receipt.status,'processed');
  }
 }
});
test('every non-SendGrid provider preserves the original lifecycle matrix and deletion ban',async()=>{
 const expected=new Set([...oldGuard.matchAll(/\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]/g)].map(match=>match[1]+'>'+match[2]));
 assert.equal(expected.size,11);
 const statuses=['received','validated','processing','processed','failed','skipped','errored'];
 for(const provider of ['stripe','sezzle','affirm','jotform','calendly','resend']){
  for(const prior of statuses)for(const next of statuses){
   const id='matrix-'+provider+'-'+prior+'-'+next;
   await db.query("insert into webhook_events_processed(event_id,provider,event_type,status) values($1,$2,'fixture',$3)",[id,provider,prior]);
   let accepted=true;
   try {await db.query('update webhook_events_processed set status=$1 where event_id=$2 returning id',[next,id]);}catch{accepted=false;}
   assert.equal(accepted,expected.has(prior+'>'+next),provider+' '+prior+'>'+next);
  }
  await assert.rejects(db.query('delete from webhook_events_processed where provider=$1 returning id',[provider]),/DELETE blocked/);
 }
});
test('anonymous and authenticated users cannot execute lease RPCs',async()=>{
 const r=await db.query("select has_function_privilege('anon','claim_inbound_webhook_event(text,text,jsonb,uuid)','execute') a,has_function_privilege('authenticated','finish_inbound_webhook_event(text,uuid,text,text,boolean)','execute') b");
 assert.equal(r.rows[0].a,false);assert.equal(r.rows[0].b,false);
});
