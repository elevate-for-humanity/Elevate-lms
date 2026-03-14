export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/lti/launch/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSupabaseClient } from '@/lib/supabase-api';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createSupabaseClient();
  const formData = await request.formData();
  const idToken = String(formData.get('id_token') || '');
  const state = String(formData.get('state') || '');

  if (!idToken || !state) {
    return NextResponse.json(
      { error: 'Missing id_token or state' },
      { status: 400 }
    );
  }

  // Note: Look up platform by iss + client_id, fetch JWKS, and verify token properly.
  // For now, we decode without verification just to see shape (do NOT do this in prod).
  const decoded: any = jwt.decode(idToken, { json: true });

  if (!decoded) {
    return NextResponse.json({ error: 'Invalid id_token' }, { status: 400 });
  }

  const issuer = decoded.iss;
  const subject = decoded.sub;
  const email =
    decoded.email ||
    decoded['https://purl.imsglobal.org/spec/lti/claim/custom']?.email;
  const name = decoded.name || decoded.given_name || decoded.family_name;

  const context = decoded['https://purl.imsglobal.org/spec/lti/claim/context'];
  const resourceLink =
    decoded['https://purl.imsglobal.org/spec/lti/claim/resource_link'];

  // Use issuer + client_id to find platform config
  const clientId = decoded.aud;
  const { data: platform } = await supabase
    .from('lti_platforms')
    .select('*')
    .eq('issuer', issuer)
    .eq('client_id', clientId)
    .single();

  if (!platform) {
    return NextResponse.json(
      { error: 'Unknown LTI platform' },
      { status: 403 }
    );
  }

  // Find / create student user based on email or sub
  const { data: user } = await supabase
    .from('users')
    .upsert(
      {
        email,
        name,
        lti_subject: subject,
      },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (!user) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }

  // Map context / resource_link to course / launch target
  const courseTitle = context?.title || 'LTI Course';
  const contextId = context?.id || '';

  const { data: course } = await supabase
    .from('training_courses')
    .upsert(
      {
        title: courseTitle,
        lti_context_id: contextId,
      },
      { onConflict: 'lti_context_id' }
    )
    .select()
    .single();

  if (!course) {
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }

  // Redirect user into LMS course page
  const toolUrl = process.env.LTI_TOOL_URL!;
  const redirectUrl = `${toolUrl}/lti/course/${course.id}?user=${user.id}`;

  return NextResponse.redirect(redirectUrl);
}
export const POST = withApiAudit('/api/lti/launch', _POST);
