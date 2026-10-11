import {requireAdminClient} from '@/lib/supabase/admin';
import {programConversationRoute,applicantConversationSubject} from './program-conversation-routing';

/** Store accepted PARIS mail in Admin and any single verified assigned holder inbox. */
export async function storeOutreachWorkspaceCopy(email:string,subject:string,text:string,html:string,providerMessageId?:string){
 const db=await requireAdminClient();
 const route=await programConversationRoute(db,[email],['admissions@elevateforhumanity.org']);
 const addresses=route?.addresses||['admissions@elevateforhumanity.org'];
 const result=await db.from('communication_email_mailboxes').select('id,address').eq('active',true).in('address',addresses);
 if(result.error||!result.data?.some(m=>m.address==='admissions@elevateforhumanity.org'))throw new Error('Outreach workspace unavailable');
 for(const mailbox of result.data){
  const normalized=applicantConversationSubject(subject,email);
  const lookup=await db.from('communication_email_threads').select('id,message_count').eq('mailbox_id',mailbox.id).eq('normalized_subject',normalized).limit(1).maybeSingle();
  let thread=lookup.data;const error=lookup.error;
  if(error)throw new Error('Outreach conversation unavailable');
  if(!thread){const created=await db.from('communication_email_threads').insert({mailbox_id:mailbox.id,subject,normalized_subject:normalized,message_count:0}).select('id,message_count').single();if(created.error)throw new Error('Outreach conversation could not be created');thread=created.data;}
  const now=new Date().toISOString();
  const message=await db.from('communication_email_messages').insert({thread_id:thread!.id,mailbox_id:mailbox.id,direction:'outbound',status:'sent',sender_email:'admissions@elevateforhumanity.org',sender_name:'PARIS · Elevate Admissions',to_addresses:[email],cc_addresses:[],bcc_addresses:[],reply_to:'admissions@elevateforhumanity.org',subject,text_body:text,html_body:html,provider_message_id:providerMessageId||null,sent_at:now});
  if(message.error)throw new Error('Accepted outreach workspace copy failed');
  const updated=await db.from('communication_email_threads').update({last_message_at:now,message_count:Number(thread!.message_count||0)+1,updated_at:now}).eq('id',thread!.id);if(updated.error)throw new Error('Outreach conversation update failed');
 }
}
