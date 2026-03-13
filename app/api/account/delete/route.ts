// app/api/account/delete/route.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { createAdminClient as createSupabaseClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const session = await requireApiAuth();
  const email = session.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClient();
  const db = supabase;
  const { data: user, error: userError } = await db
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { error: insertError } = await db.from('account_deletion_requests').insert({
    user_id: user.id,
    email: user.email,
  });

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to create deletion request. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      'Your account deletion request has been recorded. A data privacy officer will review and process it according to our policy.',
  });
}
export const POST = withApiAudit('/api/account/delete', _POST);
