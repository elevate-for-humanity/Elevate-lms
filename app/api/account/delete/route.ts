// app/api/account/delete/route.ts
import { NextResponse } from 'next/server';
import { requireApiAuth, APIAuthError } from '@/lib/auth';
import { createSupabaseClient } from '@/lib/supabase-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function POST() {
  const session = await requireApiAuth();
  const email = session.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClient();
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { error: insertError } = await supabase.from('account_deletion_requests').insert({
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
