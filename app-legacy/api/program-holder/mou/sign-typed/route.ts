import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { typedName } = body;
  if (!typedName?.trim()) {
    return NextResponse.json({ error: 'Typed name is required' }, { status: 400 });
  }

  const db = await requireAdminClient();

  // Get program_holder_id from profile
  const { data: profile } = await db
    .from('profiles')
    .select('program_holder_id, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.program_holder_id) {
    return NextResponse.json({ error: 'No program holder record found' }, { status: 400 });
  }

  const phId = profile.program_holder_id;
  const signedAt = new Date().toISOString();

  // Mark MOU as signed and promote status to 'active'
  const { error } = await db
    .from('program_holders')
    .update({
      mou_signed: true,
      mou_signed_at: signedAt,
      mou_status: 'signed',
      status: 'active',
    })
    .eq('id', phId);

  if (error) {
    return NextResponse.json({ error: 'Failed to record signature' }, { status: 500 });
  }

  // Persist signature record so the PDF download route can retrieve it
  await db
    .from('mou_signatures')
    .upsert(
      {
        user_id: user.id,
        signer_name: typedName.trim(),
        signed_at: signedAt,
        agreed_at: signedAt,
        mou_version: '2.0',
        ip_address:
          req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || null,
      },
      { onConflict: 'user_id', ignoreDuplicates: false },
    )
    .then(()=>null, ()=>null); // non-blocking — audit_log below is the compliance record

  // Log the signature for compliance
  await db
    .from('audit_logs')
    .insert({
      user_id: user.id,
      action: 'mou_signed',
      entity_type: 'program_holders',
      entity_id: phId,
      metadata: {
        typed_name: typedName.trim(),
        signed_at: signedAt,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      },
    })
    .throwOnError()
    .then(()=>null, ()=>null); // non-blocking

  return NextResponse.json({ success: true, signed_at: signedAt });
}
