import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { signSalonHostShopMou } from '@/lib/partners/sign-salon-host-mou';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return safeError('Unauthorized', 401);

  const body = await req.json();
  const salon_name = body.salon_name ?? body.salonName ?? '';
  const signer_name = body.signer_name ?? body.signerName ?? '';
  const signature_data = body.signature_data ?? body.signatureDataUrl ?? '';

  if (!salon_name || !signer_name || !signature_data) {
    return safeError('salon_name, signer_name, and signature_data are required', 400);
  }

  try {
    const db = await requireAdminClient();
    const result = await signSalonHostShopMou(db, 'esthetician', user.email, user.id, {
      salon_name,
      signer_name,
      signer_title: body.signer_title ?? body.signerTitle,
      supervisor_name: body.supervisor_name,
      supervisor_license: body.supervisor_license,
      compensation_model: body.compensation_model,
      compensation_rate: body.compensation_rate,
      signature_data,
      signed_at: body.signed_at ?? body.signedAt,
      mou_version: body.mou_version,
    });
    return NextResponse.json({ success: true, enrollmentId: result.enrollmentId });
  } catch (err) {
    if (err instanceof Error && err.message === 'NO_PARTNER') {
      return safeError('No esthetician host application found for this account', 404);
    }
    return safeInternalError(err, 'Failed to record MOU signature');
  }
}
