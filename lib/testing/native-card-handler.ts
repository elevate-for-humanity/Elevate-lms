import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { nativeCertificate } from './native-certificate';
import { nativeCardPdf } from './native-card-pdf';
export const runtime = 'nodejs';
export async function nativeCardGet(request: Request) {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('attemptId');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return NextResponse.json({ error: 'Valid attempt required' }, { status: 400 });
  const db = await requireAdminClient();
  const [{ data: attempt, error }, { data: profile }] = await Promise.all([
    db
      .from('epa_native_attempts')
      .select('candidate_id,certificate_number')
      .eq('id', id)
      .maybeSingle(),
    db.from('profiles').select('role,is_active,suspended').eq('id', user.id).maybeSingle(),
  ]);
  if (error) return NextResponse.json({ error: 'Registry unavailable' }, { status: 503 });
  if (
    !profile ||
    profile.is_active === false ||
    profile.suspended ||
    !attempt ||
    (attempt.candidate_id !== user.id && !['admin', 'super_admin'].includes(profile.role))
  )
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!attempt.certificate_number)
    return NextResponse.json({ error: 'Certification card has not been issued' }, { status: 409 });
  const record = await nativeCertificate(attempt.certificate_number);
  if (!record)
    return NextResponse.json({ error: 'Certification is not currently valid' }, { status: 409 });
  return new Response(Buffer.from(await nativeCardPdf(record)), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${record.certificate_number}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
