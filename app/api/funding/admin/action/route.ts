import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['admin', 'partner'].includes(profile.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Get request body
  const { id, action } = await req.json();

  // Fetch the application
  const { data: app, error: fetchError } = await supabase
    .from('funding_applications')
    .select('id, user_id, course_id, program_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !app) {
    return new Response('Application not found', { status: 404 });
  }

  // Process action
  if (action === 'approve') {
    // Update application status
    await supabase
      .from('funding_applications')
      .update({
        status: 'approved',
        decided_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Auto-enroll the user
    await supabase.from('program_enrollments').upsert({
      user_id: app.user_id,
      course_id: app.course_id,
      status: 'active',
      funding_source: 'Funded',
      funding_program_id: app.program_id,
    });

    // Log the action
    await supabase.from('audit_logs').insert({
      who: user.id,
      action: 'APPROVE_APP',
      subject: id,
      meta: {},
    });
  } else if (action === 'deny') {
    // Update application status
    await supabase
      .from('funding_applications')
      .update({
        status: 'denied',
        decided_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Log the action
    await supabase.from('audit_logs').insert({
      who: user.id,
      action: 'DENY_APP',
      subject: id,
      meta: {},
    });
  }

  return Response.json({ ok: true });
}
export const POST = withApiAudit('/api/funding/admin/action', _POST);
