// PUBLIC ROUTE: CDL student/sponsor MOU PDF generation — no auth required.
// Referral partners and students sign via /mou/cdl without needing an account.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { generateCDLStudentMOUPdf } from '@/lib/documents/generate-cdl-student-mou-pdf';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  if (!body?.signer_name || !body?.signer_type || !body?.cdl_class) {
    return safeError('signer_name, signer_type, and cdl_class are required', 400);
  }
  if (!['A', 'B'].includes(body.cdl_class)) {
    return safeError('cdl_class must be A or B', 400);
  }
  if (!['student', 'employer', 'agency', 'funding_partner'].includes(body.signer_type)) {
    return safeError('Invalid signer_type', 400);
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateCDLStudentMOUPdf({
      signer_type: body.signer_type,
      signer_name: body.signer_name,
      signer_title: body.signer_title ?? undefined,
      organization_name: body.organization_name ?? undefined,
      contact_email: body.contact_email ?? undefined,
      contact_phone: body.contact_phone ?? undefined,
      cdl_class: body.cdl_class,
      student_name: body.student_name ?? undefined,
      signed_at: body.signed_at ?? new Date().toISOString(),
      signature_data: body.signature_data ?? undefined,
      ip_address: request.headers.get('x-forwarded-for') ?? undefined,
      mou_version: body.mou_version ?? '2025-cdl-student-01',
    });
  } catch (err) {
    return safeInternalError(err, 'CDL MOU PDF generation failed');
  }

  // Record the signed MOU — fire and forget, non-fatal
  try {
    const db = await requireAdminClient();
    if (db) {
      await db.from('partners').insert({
        name: body.organization_name ?? body.signer_name,
        partner_type: body.signer_type === 'funding_partner' ? 'referral' : body.signer_type,
        contact_name: body.signer_name,
        contact_email: body.contact_email ?? null,
        contact_phone: body.contact_phone ?? null,
        mou_signed: true,
        mou_signed_at: body.signed_at ?? new Date().toISOString(),
        mou_version: body.mou_version ?? '2025-cdl-student-01',
        is_active: true,
        notes: `CDL Class ${body.cdl_class} MOU — signer_type: ${body.signer_type}`,
      });
    }
  } catch {
    // non-fatal — PDF still returns
  }

  const filename = `Elevate-CDL-MOU-${(body.organization_name ?? body.signer_name).replace(/\s+/g, '-')}.pdf`;

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBytes.length),
    },
  });
}
