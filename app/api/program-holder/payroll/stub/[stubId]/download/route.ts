import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/program-holder/payroll/stub/[stubId]/download
 *
 * Returns a signed URL redirect for a pay stub PDF stored in Supabase storage,
 * or a plain-text summary if no PDF is stored yet.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stubId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard();
  const { user } = auth;

  const { stubId } = await params;
  if (!stubId) return safeError('stubId is required', 400);

  const db = createAdminClient();

  // Fetch the stub — must belong to this user
  const { data: stub, error } = await db
    .from('pay_stubs')
    .select('id, user_id, gross_pay, net_pay, created_at, pdf_url, payroll_run_id')
    .eq('id', stubId)
    .eq('user_id', user.id)
    .single();

  if (error || !stub) return safeError('Pay stub not found', 404);

  // If a PDF URL is stored, redirect to it (signed if it's a Supabase storage path)
  if (stub.pdf_url) {
    // If it's already a full URL, redirect directly
    if (stub.pdf_url.startsWith('http')) {
      return NextResponse.redirect(stub.pdf_url);
    }

    // Otherwise treat as a Supabase storage path and generate a signed URL
    const { data: signed, error: signErr } = await db.storage
      .from('module-certificates')
      .createSignedUrl(stub.pdf_url, 300); // 5-minute expiry

    if (signErr || !signed?.signedUrl) {
      return safeError('Could not generate download link', 500);
    }

    return NextResponse.redirect(signed.signedUrl);
  }

  // No PDF stored — return a plain-text pay stub summary as a downloadable file
  const date = new Date(stub.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const text = [
    'ELEVATE FOR HUMANITY — PAY STUB',
    '================================',
    `Date:       ${date}`,
    `Stub ID:    ${stub.id}`,
    `Gross Pay:  $${Number(stub.gross_pay ?? 0).toFixed(2)}`,
    `Net Pay:    $${Number(stub.net_pay ?? 0).toFixed(2)}`,
    '',
    'For questions contact: billing@elevateforhumanity.org',
  ].join('\n');

  return new NextResponse(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="pay-stub-${stub.id.slice(0, 8)}.txt"`,
    },
  });
}
