#!/usr/bin/env tsx

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const email = process.env.TARGET_EMAIL?.trim().toLowerCase();
const expectedUserId = process.env.EXPECTED_USER_ID?.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
const resendKey = process.env.RESEND_API_KEY?.trim();
const siteUrl = (process.env.LMS_SITE_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');

if (!email || !expectedUserId || !supabaseUrl || !serviceRoleKey || (!sendgridKey && !resendKey)) {
  throw new Error('Target identity, Supabase admin credentials, and one email provider key are required');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = `El!${crypto.randomBytes(18).toString('base64url')}9a`;

const { data: userResult, error: userError } = await admin.auth.admin.getUserById(expectedUserId);
if (userError || !userResult.user) throw new Error(`Auth user lookup failed: ${userError?.message || 'not found'}`);
if (userResult.user.email?.toLowerCase() !== email) throw new Error('Expected user ID does not match target email');

const { data: profile, error: profileError } = await admin
  .from('profiles')
  .select('id,email,full_name,role,is_active')
  .eq('id', expectedUserId)
  .single();
if (profileError || !profile) throw new Error(`Profile lookup failed: ${profileError?.message || 'not found'}`);
if (profile.role !== 'program_holder' || profile.is_active !== true) throw new Error('Target is not an active program holder');

const { data: holder, error: holderError } = await admin
  .from('program_holders')
  .select('id,user_id,organization_name,status')
  .eq('user_id', expectedUserId)
  .single();
if (holderError || !holder) throw new Error(`Program-holder lookup failed: ${holderError?.message || 'not found'}`);
if (holder.status !== 'approved') throw new Error('Target program holder is not approved');

const { error: updateError } = await admin.auth.admin.updateUserById(expectedUserId, {
  password,
  email_confirm: true,
  app_metadata: { ...userResult.user.app_metadata, role: 'program_holder' },
});
if (updateError) throw new Error(`Password update failed: ${updateError.message}`);

const verifier = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: signIn, error: signInError } = await verifier.auth.signInWithPassword({ email, password });
if (signInError || signIn.user?.id !== expectedUserId) {
  throw new Error(`Password verification failed: ${signInError?.message || 'wrong user returned'}`);
}
await verifier.auth.signOut();

const message = {
  personalizations: [{ to: [{ email }], bcc: [{ email: 'elevate4humanityedu@gmail.com' }] }],
  from: { email: 'info@elevateforhumanity.org', name: 'Elevate for Humanity' },
  reply_to: { email: 'elevate4humanityedu@gmail.com' },
  subject: 'Your Elevate Program Holder Login',
  content: [{
    type: 'text/html',
    value: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033;line-height:1.6"><h2>Your program-holder account is ready</h2><p>Hello ${profile.full_name || 'David'},</p><p>Your permanent Elevate portal login has been set and verified.</p><div style="padding:18px;border:1px solid #dbe3ee;border-radius:10px;background:#f8fafc"><p><strong>Email:</strong> ${email}</p><p><strong>Password:</strong> ${password}</p><p><a href="${siteUrl}/login">Sign in to Elevate</a></p></div><p>After signing in, you will be routed to the Program Holder dashboard for ${holder.organization_name}.</p><p>Elevate for Humanity</p></div>`,
  }],
};

const response = sendgridKey
  ? await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  : await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Elevate for Humanity <info@elevateforhumanity.org>',
        to: [email],
        bcc: ['elevate4humanityedu@gmail.com'],
        reply_to: 'elevate4humanityedu@gmail.com',
        subject: message.subject,
        html: message.content[0].value,
      }),
    });
if (!response.ok) throw new Error(`Credential email provider rejected the request with status ${response.status}`);

console.log(`Password reset, sign-in verified, and credential email accepted for ${email}; user_id=${expectedUserId}`);
