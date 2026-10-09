import {requireAdminClient} from '../lib/supabase/admin';
import {hydrateProcessEnv} from '../lib/secrets';
import {sendEmail} from '../lib/email/sendgrid';
import {storeOutreachWorkspaceCopy} from '../lib/email/outreach-workspace-copy';
import {APPLICANT_OUTREACH_CAMPAIGN,APPLICANT_OUTREACH_SUBJECT,classifyApplicantReply,applicantOutreachText,type OutreachProgram} from '../lib/email/applicant-outreach-policy';

type SourceRecord={table:string;id:string};
type Contact={id:string;campaign_key:string;email:string;first_name:string;programs:OutreachProgram[];source_records:SourceRecord[];sent_at:string};
type Row={id:string;email?:string;first_name?:string;full_name?:string;applicant_name?:string;applicant_email?:string;program_id?:string;program_slug?:string;program_interest?:string;status?:string;outreach_interest?:string;slug?:string;title?:string;slug_aliases?:string[];is_active?:boolean;archived_at?:string;status_type?:string;status_value?:string;public_claim_allowed?:boolean;expiration_date?:string;payload?:{email?:string}};
type Inbound={id:string;sender_email:string;subject:string;text_body:string;received_at:string;to_addresses:string[]};
type Reply={message_id:string;contact_id:string};
const FROM='admissions@elevateforhumanity.org';
function fail(error:unknown){if(error) throw new Error('Outreach database operation failed');}
function normalize(value:unknown){return String(value||'').trim().toLowerCase();}
function html(text:string){return '<div style="font-family:Arial,sans-serif;line-height:1.6">'+text.split('\n').map(line=>'<p>'+line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/(https:\/\/[^\s]+)/g,'<a href="$1">$1</a>')+'</p>').join('')+'</div>';}

export async function runApplicantOutreach(mode:string){
 if(!['prepare','send','replies'].includes(mode))throw new Error('Invalid outreach mode');
 await hydrateProcessEnv();
 const db=await requireAdminClient();
 type Query=ReturnType<ReturnType<typeof db.from>['select']>;
 async function all<T=Row>(table:string,columns:string,filter?: (q:Query)=>Query){
  const rows:T[]=[];
  for(let offset=0;;offset+=500){let q=db.from(table).select(columns).order('id').range(offset,offset+499);if(filter)q=filter(q);const result=await q;fail(result.error);rows.push(...result.data as unknown as T[]);if(result.data.length<500)return rows;}
 }
 if(mode==='prepare'){
  const [applications,holders,leads,crm,programs,evidence,suppressions]=await Promise.all([
   all('applications','id,email,first_name,program_id,program_slug,program_interest,status,outreach_interest'),
   all('program_holder_students','id,applicant_email,applicant_name,program_id,status,outreach_interest',q=>q.in('status',['applied','pending'])),
   all('leads','id,email,first_name,program_interest,status'),
   all('crm_leads','id,email,full_name,program_slug,role,application_id,status',q=>q.or('role.in.(student,applicant),application_id.not.is.null')),
   all('programs','id,slug,title,slug_aliases,is_active,archived_at'),
   all('program_regulatory_status','id,program_id,status_type,status_value,public_claim_allowed,expiration_date'),
   all('email_delivery_events','id,event_type,payload',q=>q.in('event_type',['unsubscribe','group_unsubscribe','spamreport']))
  ]);
  const fundedIds=new Set(evidence.filter(r=>r.public_claim_allowed && r.status_value==='verified' && ['wrg','wioa'].includes(r.status_type) && (!r.expiration_date||r.expiration_date>=new Date().toISOString().slice(0,10))).map(r=>r.program_id));
  const catalog=new Map<string,OutreachProgram>();
  for(const p of programs.filter(p=>p.is_active&&!p.archived_at&&/^[a-z0-9][a-z0-9-]*$/.test(p.slug||'')))for(const alias of [p.id,p.slug,p.title,...(Array.isArray(p.slug_aliases)?p.slug_aliases:[])])catalog.set(normalize(alias),{slug:String(p.slug),title:String(p.title),funded:fundedIds.has(p.id)});
  const blocked=new Set(suppressions.map(r=>normalize(r.payload?.email)).filter(Boolean));
  const prior=await db.from('applicant_outreach_contacts').select('email').eq('interest','not_interested');fail(prior.error);for(const r of prior.data||[])blocked.add(r.email);
  const contacts=new Map<string,Omit<Contact,'id'|'sent_at'>>();let excluded=0;
  const sources=[...applications.map(r=>({...r,table:'applications'})),...holders.map(r=>({...r,email:r.applicant_email,first_name:r.applicant_name,table:'program_holder_students'})),...leads.map(r=>({...r,table:'leads'})),...crm.map(r=>({...r,first_name:r.full_name,table:'crm_leads'}))];
  for(const r of sources){const email=normalize(r.email);if(['withdrawn','exited','unsubscribed','not_interested','archived','deleted'].includes(normalize(r.status))||r.outreach_interest==='not_interested')blocked.add(email);}
  for(const r of sources){const email=normalize(r.email);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||blocked.has(email)||/\.(?:invalid|test|example)$|@example\.(?:com|org|net)$/.test(email)||/\b(?:e2e|qa fixture|synthetic|test user)\b/i.test(r.first_name||'')){excluded++;continue;}
   let c=contacts.get(email);if(!c){c={campaign_key:APPLICANT_OUTREACH_CAMPAIGN,email,first_name:String(r.first_name||'there').slice(0,80),programs:[],source_records:[]};contacts.set(email,c);}
   c.source_records.push({table:r.table,id:r.id});const p=catalog.get(normalize(r.program_id))||catalog.get(normalize(r.program_slug))||catalog.get(normalize(r.program_interest));if(p&&!c.programs.some((v:OutreachProgram)=>v.slug===p.slug))c.programs.push(p);
  }
  const rows=[...contacts.values()];for(let i=0;i<rows.length;i+=100){const r=await db.from('applicant_outreach_contacts').upsert(rows.slice(i,i+100),{onConflict:'campaign_key,email',ignoreDuplicates:true});fail(r.error);}
  console.info(JSON.stringify({mode,uniqueRecipients:rows.length,excludedSourceRecords:excluded,workoneRecipients:rows.filter(c=>c.programs.some((p:OutreachProgram)=>p.funded)).length,selfPayRecipients:rows.filter(c=>c.programs.some((p:OutreachProgram)=>!p.funded)).length,programSelectionRequired:rows.filter(c=>!c.programs.length).length}));return;
 }
 if(mode==='send'){
  if(!process.env.SENDGRID_API_KEY)throw new Error('Email transport is not configured');
  const queued=await all<Contact>('applicant_outreach_contacts','*',q=>q.eq('campaign_key',APPLICANT_OUTREACH_CAMPAIGN).eq('send_status','queued'));let accepted=0,failed=0;
  for(const c of queued){const claim=await db.from('applicant_outreach_contacts').update({send_status:'sending'}).eq('id',c.id).eq('send_status','queued').select('id');fail(claim.error);if(!claim.data?.length)continue;
   const text=applicantOutreachText(c.first_name,c.programs);let result:Awaited<ReturnType<typeof sendEmail>>;try{result=await sendEmail({to:c.email,from:`Elevate Admissions <${FROM}>`,replyTo:FROM,subject:APPLICANT_OUTREACH_SUBJECT,text,html:html(text)});}catch{result={success:false};}
   const update=await db.from('applicant_outreach_contacts').update({send_status:result.success?'accepted':'unknown',sent_at:result.success?new Date().toISOString():null,error_code:result.success?null:'provider_response_not_confirmed'}).eq('id',c.id);fail(update.error);if(result.success){accepted++;await storeOutreachWorkspaceCopy(c.email,APPLICANT_OUTREACH_SUBJECT,text,html(text),result.data?.messageId);}else failed++;
  }console.info(JSON.stringify({mode,accepted,unconfirmed:failed}));if(failed)throw new Error('Some outreach provider responses require review');return;
 }
 const contacts=await all<Contact>('applicant_outreach_contacts','*',q=>q.eq('campaign_key',APPLICANT_OUTREACH_CAMPAIGN).eq('send_status','accepted'));
 const earliest=contacts.map(c=>c.sent_at).filter(Boolean).sort()[0];if(!earliest){console.info(JSON.stringify({mode,received:0}));return;}
 const incoming=await all<Inbound>('communication_email_messages','id,inbound_event_id,sender_email,subject,text_body,received_at,to_addresses',q=>q.eq('direction','inbound').gte('received_at',earliest).ilike('subject',`%${APPLICANT_OUTREACH_SUBJECT}%`));
 const byEmail=new Map(contacts.map(c=>[c.email,c]));let classified=0;
 for(const m of incoming.sort((a,b)=>String(a.received_at).localeCompare(b.received_at))){const c=byEmail.get(normalize(m.sender_email));if(!c||!(m.to_addresses||[]).includes(FROM)||m.received_at<c.sent_at)continue;const outcome=classifyApplicantReply(m.text_body||'');const r=await db.rpc('record_applicant_outreach_reply',{p_message_id:m.id,p_contact_id:c.id,p_outcome:outcome});fail(r.error);if(r.data)classified++;}
 const pending=await all<Reply>('applicant_outreach_replies','*',q=>q.eq('followup_status','pending'));let followedUp=0;
 for(const r of pending){const c=contacts.find(c=>c.id===r.contact_id);if(!c)continue;const current=await db.from('applicant_outreach_contacts').select('interest,archived_at').eq('id',c.id).single();fail(current.error);if(current.data.interest!=='interested'||current.data.archived_at){const skipped=await db.from('applicant_outreach_replies').update({followup_status:'not_required'}).eq('message_id',r.message_id);fail(skipped.error);continue;}
  const claim=await db.from('applicant_outreach_replies').update({followup_status:'sending'}).eq('message_id',r.message_id).eq('followup_status','pending').select('message_id');fail(claim.error);if(!claim.data?.length)continue;
  const text=applicantOutreachText(c.first_name,c.programs,true);let result:Awaited<ReturnType<typeof sendEmail>>;try{result=await sendEmail({to:c.email,from:`PARIS · Elevate Admissions <${FROM}>`,replyTo:FROM,subject:`Re: ${APPLICANT_OUTREACH_SUBJECT}`,text,html:html(text)});}catch{result={success:false};}
  const updated=await db.from('applicant_outreach_replies').update({followup_status:result.success?'accepted':'unknown'}).eq('message_id',r.message_id);fail(updated.error);if(result.success){followedUp++;await storeOutreachWorkspaceCopy(c.email,`Re: ${APPLICANT_OUTREACH_SUBJECT}`,text,html(text),result.data?.messageId);}
 }console.info(JSON.stringify({mode,classified,followedUp}));
}
if(import.meta.url===`file://${process.argv[1]}`)runApplicantOutreach(process.argv[2]||'prepare').catch(()=>{console.error('Applicant outreach could not complete; inspect saved progress without resending uncertain attempts.');process.exitCode=1;});
