import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });

  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  // Validate token
  const { data: tokenData } = await supabase
    .from('approval_tokens')
    .select('token, application_id, used_at')
    .eq('token', token)
    .maybeSingle();

  if (!tokenData) {
    const html = `
      <html>
        <head>
          <title>Invalid Token</title>
          <style>
            body { font-family: sans-serif; padding: 48px; max-width: 600px; margin: 0 auto; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h2 class="error">Invalid Approval Link</h2>
          <p>This approval link is not valid. Please contact support if you believe this is an error.</p>
        </body>
      </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }

  if (tokenData.used_at) {
    const html = `
      <html>
        <head>
          <title>Already Confirmed</title>
          <style>
            body { font-family: sans-serif; padding: 48px; max-width: 600px; margin: 0 auto; }
            .success { color: #16a34a; }
          </style>
        </head>
        <body>
          <h2 class="success">Already Confirmed</h2>
          <p>This application has already been approved. The learner has been notified and enrolled.</p>
          <p>You can close this window.</p>
        </body>
      </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }

  // Get application
  const { data: app } = await supabase
    .from('funding_applications')
    .select('id, user_id, course_id, program_id, status')
    .eq('id', tokenData.application_id)
    .single();

  if (!app) {
    return new Response('Application not found', { status: 404 });
  }

  // Mark token as used
  await supabase
    .from('approval_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);

  // Approve application
  await supabase
    .from('funding_applications')
    .update({
      status: 'approved',
      decided_at: new Date().toISOString(),
    })
    .eq('id', app.id);

  // Create enrollment
  await supabase.from('enrollments').upsert({
    user_id: app.user_id,
    course_id: app.course_id,
    status: 'active',
    funding_source: 'Funded',
    funding_program_id: app.program_id,
  });

  // Log the action
  await supabase.from('audit_logs').insert({
    who: null, // Case manager approval (no user session)
    action: 'APPROVE_APP_TOKEN',
    subject: app.id,
    meta: { token },
  });

  // Success page
  const html = `
    <html>
      <head>
        <title>Approval Confirmed</title>
        <style>
          body {
            font-family: sans-serif;
            padding: 48px;
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(to bottom right, #2563eb, #9333ea);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card {
            background: white;
            padding: 32px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .success { color: #16a34a; margin-top: 0; }
          .checkmark {
            width: 64px;
            height: 64px;
            background: #16a34a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: white;
            font-size: 32px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="checkmark">✓</div>
          <h2 class="success">Approval Confirmed!</h2>
          <p>Thank you for confirming this application. The learner has been enrolled and will receive access immediately.</p>
          <p>They will receive a welcome email with login instructions.</p>
          <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can close this window.</p>
        </div>
      </body>
    </html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
