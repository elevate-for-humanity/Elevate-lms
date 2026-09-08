import { createClient } from '@supabase/supabase-js';

const APPLICATION_ID = '5650e087-19b4-420e-9899-a102d161ae2f';
const PROGRAM_SLUG = 'cdl-training';
const PORTAL_URL = 'https://app.elevateforhumanity.org/program-holder/dashboard';

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const db = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
  throw new Error('Unable to complete auth-user lookup');
}

async function sendWelcomeEmail({ email, contactName, actionLink }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email, name: contactName }] }],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'info@elevateforhumanity.org',
        name: 'Elevate for Humanity',
      },
      subject: 'Your CDL Academy Program Holder portal is ready',
      content: [{
        type: 'text/html',
        value: `<p>Hello ${contactName},</p><p>The CDL Academy has been activated as a Program Holder for the CDL Training program.</p><p><a href="${actionLink}">Set your password and open the Program Holder portal</a></p><p>After setting your password, you can return to <a href="${PORTAL_URL}">${PORTAL_URL}</a>.</p><p>Elevate for Humanity</p>`,
      }],
    }),
  });
  if (!response.ok) throw new Error(`SendGrid failed (${response.status}): ${await response.text()}`);
}

const { data: application, error: applicationError } = await db
  .from('program_holder_applications')
  .select('*')
  .eq('id', APPLICATION_ID)
  .single();
if (applicationError || !application) throw applicationError || new Error('Application record not found');

const email = application.email.trim().toLowerCase();
const { data: program, error: programError } = await db
  .from('programs')
  .select('id, slug, title')
  .eq('slug', PROGRAM_SLUG)
  .single();
if (programError || !program) throw programError || new Error('CDL Training program not found');

let user = await findUserByEmail(email);
if (!user) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: application.contact_name,
      organization_name: application.organization_name,
      role: 'program_holder',
    },
  });
  if (error || !data.user) throw error || new Error('Auth user creation failed');
  user = data.user;
}

const holderValues = {
  user_id: user.id,
  organization_name: application.organization_name,
  name: application.organization_name,
  contact_name: application.contact_name,
  contact_email: email,
  contact_phone: application.phone,
  status: 'active',
  verification_status: 'verified',
  primary_program_id: program.id,
  is_using_internal_lms: true,
  approved_at: new Date().toISOString(),
  reviewed_at: new Date().toISOString(),
  mou_signed: true,
  mou_signed_at: '2026-05-30T18:47:05.000Z',
  mou_status: 'signed',
  mou_type: 'universal',
  updated_at: new Date().toISOString(),
};

let { data: holder, error: holderLookupError } = await db
  .from('program_holders')
  .select('id, welcome_email_sent')
  .or(`user_id.eq.${user.id},contact_email.eq.${email}`)
  .maybeSingle();
if (holderLookupError) throw holderLookupError;
if (holder) {
  const result = await db.from('program_holders').update(holderValues).eq('id', holder.id).select('id, welcome_email_sent').single();
  if (result.error) throw result.error;
  holder = result.data;
} else {
  const result = await db.from('program_holders').insert(holderValues).select('id, welcome_email_sent').single();
  if (result.error) throw result.error;
  holder = result.data;
}

const { error: profileError } = await db.from('profiles').upsert({
  id: user.id,
  email,
  full_name: application.contact_name,
  first_name: application.contact_name?.split(/\s+/)[0] || null,
  last_name: application.contact_name?.split(/\s+/).slice(1).join(' ') || null,
  company: application.organization_name,
  company_name: application.organization_name,
  role: 'program_holder',
  roles: ['program_holder'],
  portal_type: 'program_holder',
  program_holder_id: holder.id,
  status: 'active',
  enrollment_status: 'active',
  is_active: true,
  verified: true,
  program: program.title,
  updated_at: new Date().toISOString(),
}, { onConflict: 'id' });
if (profileError) throw profileError;

const { error: assignmentError } = await db.from('program_holder_programs').upsert({
  program_holder_id: holder.id,
  program_id: program.id,
  program_slug: program.slug,
  role_in_program: 'owner',
  is_primary: true,
  status: 'active',
}, { onConflict: 'program_holder_id,program_id' });
if (assignmentError) throw assignmentError;

const { error: applicationUpdateError } = await db.from('program_holder_applications').update({
  user_id: user.id,
  status: 'approved',
  updated_at: new Date().toISOString(),
}).eq('id', application.id);
if (applicationUpdateError) throw applicationUpdateError;

const { error: providerUpdateError } = await db.from('provider_applications').update({
  status: 'approved',
  reviewed_at: new Date().toISOString(),
  review_notes: 'Provisioned as Program Holder for CDL Training.',
  updated_at: new Date().toISOString(),
}).ilike('contact_email', email);
if (providerUpdateError) throw providerUpdateError;

if (!holder.welcome_email_sent) {
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: PORTAL_URL },
  });
  if (linkError || !linkData?.properties?.action_link) throw linkError || new Error('Portal link generation failed');
  await sendWelcomeEmail({ email, contactName: application.contact_name, actionLink: linkData.properties.action_link });
  const { error: sentError } = await db.from('program_holders').update({ welcome_email_sent: true, updated_at: new Date().toISOString() }).eq('id', holder.id);
  if (sentError) throw sentError;
}

console.log(JSON.stringify({ success: true, userId: user.id, programHolderId: holder.id, programId: program.id, welcomeEmailSent: true }));
