// Elizabeth Greene explicitly authorized this application's approval on 2026-10-28.
// Scope: CNA onboarding only; this does not sign agreements or verify payments.
const applicationId = '3a8ce4e3-3a79-409f-9d16-f0bba6daee28';
const email = 'contact@achieveindiana.org';
const actorId = '8e352e99-d552-4690-b8e7-8a560bb1f873';
const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (base !== 'https://cuxzzpsyufcewtmicszk.supabase.co' || !key) throw Error('Expected production connection unavailable');
if (!process.env.SENDGRID_API_KEY) throw Error('Email provider unavailable; no changes made');
const headers = {apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json'};
async function api(path, method='GET', body, prefer='return=representation') {
  const response = await fetch(`${base}${path}`, {method, headers:{...headers, Prefer:prefer}, ...(body ? {body:JSON.stringify(body)} : {})});
  const result = await response.text();
  if (!response.ok) throw Error(`Database/Auth request failed (${response.status}) at ${path.split('?')[0]}`);
  return result ? JSON.parse(result) : null;
}
const rest = '/rest/v1/';
const [app] = await api(`${rest}program_holder_applications?id=eq.${applicationId}&select=*`);
if (!app || app.email?.toLowerCase() !== email || app.organization_name !== 'Achieve Training Institute' || !['pending','approved'].includes(app.status)) throw Error('Application identity/state mismatch');
if (JSON.stringify(app.data?.requested_program_slugs) !== '["cna"]') throw Error('Unexpected requested programs');
const [actor] = await api(`${rest}profiles?id=eq.${actorId}&select=role`);
if (!['admin','super_admin'].includes(actor?.role)) throw Error('Approving administrator not verified');
const [program] = await api(`${rest}programs?slug=eq.cna&select=id,slug,title,is_active,status`);
if (!program || program.is_active === false || ['inactive','archived'].includes(program.status)) throw Error('CNA program unavailable');
let user;
for(let page=1;page<=20;page++) {
  const users = (await api(`/auth/v1/admin/users?page=${page}&per_page=1000`)).users;
  user = users.find(u=>u.email?.toLowerCase()===email);
  if(user || users.length<1000) break;
  if(page===20) throw Error('Auth lookup incomplete');
}
const name = app.contact_name && app.contact_name.toLowerCase() !== 'email' ? app.contact_name : 'Achieve Training Institute Team';
if (!user) user = await api('/auth/v1/admin/users','POST',{email,email_confirm:true,user_metadata:{full_name:name,organization_name:app.organization_name}});
if (!user?.id) throw Error('Account provisioning failed');
let [holder] = await api(`${rest}program_holders?contact_email=eq.${email}&select=*`);
if (holder?.user_id && holder.user_id !== user.id) throw Error('Conflicting holder identity');
const now = new Date().toISOString();
if (!holder) {
  [holder] = await api(`${rest}program_holders`,'POST',{
    user_id:user.id,organization_name:app.organization_name,name:app.organization_name,
    contact_name:name,contact_email:email,contact_phone:app.phone,
    status:'approved_pending_mou',mou_signed:false,mou_status:'pending_signature',mou_type:'universal',
    approved_at:now,approved_by:actorId,primary_program_id:program.id,
    features:{approved_role:'Program Holder',onboarding_contract_version:'2026-09-role-scoped-program-holder'},
  });
}
const [priorProfile] = await api(`${rest}profiles?id=eq.${user.id}&select=*`);
if (priorProfile && !['student','program_holder',null].includes(priorProfile.role)) throw Error('Existing account role requires manual reconciliation');
await api(`${rest}profiles?on_conflict=id`,'POST',{
  id:user.id,email,full_name:priorProfile?.full_name && priorProfile.full_name.toLowerCase()!=='email' ? priorProfile.full_name : name,
  role:'program_holder',program_holder_id:holder.id,company_name:app.organization_name,is_active:true,
},'resolution=merge-duplicates,return=representation');
await api(`${rest}program_holder_programs?on_conflict=program_holder_id,program_id`,'POST',{
  program_holder_id:holder.id,program_id:program.id,program_slug:'cna',role_in_program:'owner',is_primary:true,status:'active',
},'resolution=merge-duplicates,return=representation');
await api(`${rest}program_holder_applications?id=eq.${applicationId}`,'PATCH',{
  status:'approved',user_id:user.id,updated_at:now,
  data:{...app.data,approved_at:app.data?.approved_at||now,approved_by:actorId,program_holder_id:holder.id,provisioned_program_slugs:['cna']},
});
const [verifiedHolder] = await api(`${rest}program_holders?id=eq.${holder.id}&select=id,user_id,status,mou_signed,welcome_email_sent`);
const [verifiedProfile] = await api(`${rest}profiles?id=eq.${user.id}&select=role,program_holder_id`);
if(verifiedHolder.user_id!==user.id || verifiedProfile.role!=='program_holder' || verifiedProfile.program_holder_id!==holder.id) throw Error('Provisioning readback failed');
const subject = 'Welcome to the Elevate team — Achieve CNA Program Holder onboarding';
const sent = await api(`${rest}email_logs?recipient_email=eq.${email}&subject=eq.${encodeURIComponent(subject)}&status=in.(sent,delivered,accepted)&select=id&limit=1`);
if (!sent.length && !verifiedHolder.welcome_email_sent) {
  const destination = '/reset-password?portal=program-holder&mode=recovery';
  const link = await api('/auth/v1/admin/generate_link','POST',{
    type:'recovery',email,redirect_to:`https://app.elevateforhumanity.org/auth/callback?redirect=${encodeURIComponent(destination)}`,
  });
  if(!link.action_link) throw Error('Secure setup link unavailable');
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;line-height:1.6;color:#172554"><h2>Welcome to the Elevate team!</h2><p>Hello Achieve Training Institute Team,</p><p>Welcome to Elevate for Humanity. Achieve Training Institute's Program Holder application for <strong>Certified Nursing Assistant (CNA)</strong> is approved for onboarding. We are glad to have you join the team.</p><p><strong>Username:</strong> ${email}<br><strong>Password:</strong> Use the secure button below to create your own password.</p><p><a href="${link.action_link}" style="display:inline-block;padding:14px 20px;background:#1d4ed8;color:white;border-radius:8px;text-decoration:none">Set your password and begin onboarding</a></p><p>After setting your password, complete the onboarding checklist in your dashboard:</p><ol><li>Review and sign your assigned Program Holder MOU.</li><li>Complete your profile and confirm the correct Program Director/contact name.</li><li>Submit the documents requested in your checklist, including applicable organization, tax, and CNA approval/instructor records. Previously submitted documents do not need to be uploaded again if they are already on file.</li><li>Open Payouts and complete your available secure provider setup. Never send banking credentials or account details by email.</li></ol><p>Approval and dashboard access do not mean banking is verified or payments are active. Required agreements, document reviews, and payment verification remain separate steps.</p><p>For future sign-ins: <a href="https://app.elevateforhumanity.org/login?portal=program-holder&redirect=%2Fprogram-holder%2Fdashboard">Open your Program Holder dashboard</a>. If your setup link expires, select Forgot password using the username above.</p><p>Please reply if you need assistance getting started.</p><p>Elizabeth Greene<br>Elevate for Humanity</p></div>`;
  const response = await fetch('https://api.sendgrid.com/v3/mail/send',{method:'POST',headers:{Authorization:`Bearer ${process.env.SENDGRID_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({
    personalizations:[{to:[{email,name}]}],from:{email:process.env.SENDGRID_FROM_EMAIL||'info@elevateforhumanity.org',name:'Elevate for Humanity'},
    reply_to:{email:'elevateforhumanity@www.elevateforhumanity.org',name:'Elizabeth Greene'},subject,
    content:[{type:'text/html',value:html}],tracking_settings:{click_tracking:{enable:false,enable_text:false}},
  })});
  if(!response.ok) throw Error(`Welcome email not accepted (${response.status}); account is provisioned`);
  await api(`${rest}email_logs`,'POST',{recipient_email:email,recipient:email,to:email,subject,provider:'sendgrid',status:'sent',sent_at:new Date().toISOString(),action:'program_holder_approval_notification',details:{application_id:applicationId,program_holder_id:holder.id,provider_message_id:response.headers.get('x-message-id'),event:'approved'}});
  await api(`${rest}program_holders?id=eq.${holder.id}`,'PATCH',{welcome_email_sent:true,updated_at:new Date().toISOString()});
}
console.log(JSON.stringify({success:true,applicationId,programHolderId:holder.id,userId:user.id,program:'cna',mouSigned:verifiedHolder.mou_signed,welcomeEmailAccepted:true}));
