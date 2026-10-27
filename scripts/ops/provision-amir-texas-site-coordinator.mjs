#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key) throw new Error('Missing production Supabase credentials');
const db=createClient(url,key,{auth:{persistSession:false}});
const EMAIL='topacesolutions@gmail.com';
const APPLICATION_ID='6c448504-fa9b-4b12-938c-31c35ee81688';
const now=new Date().toISOString();

const {data:app,error:appErr}=await db.from('program_holder_applications').select('*').eq('id',APPLICATION_ID).single();
if(appErr||!app) throw appErr||new Error('Amir application missing');
let {data:profile}=await db.from('profiles').select('id,program_holder_id').eq('email',EMAIL).maybeSingle();
let userId=profile?.id;
if(!userId){
  const {data:list}=await db.auth.admin.listUsers({page:1,perPage:1000});
  userId=list?.users?.find(u=>u.email?.toLowerCase()===EMAIL)?.id;
}
if(!userId){
  const password=crypto.randomUUID().replaceAll('-','')+'Aa1!';
  const {data,error}=await db.auth.admin.createUser({email:EMAIL,password,email_confirm:true,user_metadata:{full_name:'Amir Naseen',role:'site_coordinator'},app_metadata:{role:'site_coordinator'}});
  if(error||!data.user) throw error||new Error('Auth creation failed');
  userId=data.user.id;
}
const features={...(app.data||{}),approved_role:'Texas State Site Coordinator',payout_provider:'quickbooks',onboarding_contract_version:'2026-09-texas-site-coordinator'};
let {data:holder}=await db.from('program_holders').select('id').or(`user_id.eq.${userId},contact_email.eq.${EMAIL}`).limit(1).maybeSingle();
if(!holder){
 const {data,error}=await db.from('program_holders').insert({user_id:userId,organization_name:app.organization_name,name:app.organization_name,contact_name:app.contact_name,contact_email:EMAIL,contact_phone:app.phone,status:'approved_pending_mou',approved_at:now,mou_signed:false,mou_status:'pending_signature',mou_type:'universal',features}).select('id').single();
 if(error) throw error; holder=data;
}else{
 const {error}=await db.from('program_holders').update({user_id:userId,status:'approved_pending_mou',features,contact_phone:app.phone}).eq('id',holder.id); if(error) throw error;
}
const {error:profErr}=await db.from('profiles').upsert({id:userId,email:EMAIL,full_name:'Amir Naseen',role:'site_coordinator',program_holder_id:holder.id,phone:app.phone,is_active:true,updated_at:now},{onConflict:'id'});
if(profErr) throw profErr;
await db.auth.admin.updateUserById(userId,{app_metadata:{role:'site_coordinator'},user_metadata:{full_name:'Amir Naseen',role:'site_coordinator'}});
const {data:programs,error:progErr}=await db.from('programs').select('id,slug').eq('is_active',true).not('status','in','("archived","inactive")');
if(progErr) throw progErr;
if(programs?.length){
 const rows=programs.map((p,i)=>({program_holder_id:holder.id,program_id:p.id,program_slug:p.slug,role_in_program:'owner',is_primary:i===0,status:'active'}));
 const {error}=await db.from('program_holder_programs').upsert(rows,{onConflict:'program_holder_id,program_id'}); if(error) throw error;
}
const {error:updateErr}=await db.from('program_holder_applications').update({status:'approved',user_id:userId,data:{...(app.data||{}),approved_at:now,program_holder_id:holder.id},updated_at:now}).eq('id',APPLICATION_ID);
if(updateErr) throw updateErr;
const redirectTo='https://app.elevateforhumanity.org/auth/callback?redirect='+encodeURIComponent('/reset-password?portal=program-holder&mode=recovery&next=/program-holder/sign-mou');
const {data:link,error:linkErr}=await db.auth.admin.generateLink({type:'recovery',email:EMAIL,options:{redirectTo}});
if(linkErr) throw linkErr;
console.log(JSON.stringify({ok:true,userId,holderId:holder.id,programCount:programs?.length||0,accessLinkGenerated:Boolean(link?.properties?.action_link)}));
