// PUBLIC ROUTE: Employer MOU PDF generation — no auth required.
// Partners sign via /mou/employer without needing an account.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { generateEmployerMOUPdf } from '@/lib/documents/generate-employer-mou-pdf';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  if (!body?.employer_name || !body?.signer_name || !body?.signer_title) {
    return safeError('employer_name, signer_name, and signer_title are required', 400);
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateEmployerMOUPdf({
      employer_name: body.employer_name,
      signer_name: body.signer_name,
      signer_title: body.signer_title,
      contact_email: body.contact_email ?? undefined,
      contact_phone: body.contact_phone ?? undefined,
      city: body.city ?? undefined,
      state: body.state ?? 'IN',
      programs: body.programs ?? [],
      signed_at: body.signed_at ?? new Date().toISOString(),
      signature_data: body.signature_data ?? undefined,
      ip_address: request.headers.get('x-forwarded-for') ?? undefined,
      mou_version: body.mou_version ?? '2025-employer-01',
    });
  } catch (err) {
    return safeInternalError(err, 'MOU PDF generation failed');
  }

  // Save partner record — fire and forget, non-fatal
  if (body.create_partner) {
    try {
      const db = await requireAdminClient();
      if (db) {
        await db.from('partners').insert({
          name: body.employer_name,
          partner_type: 'employer',
          contact_name: body.signer_name,
          contact_email: body.contact_email ?? null,
          contact_phone: body.contact_phone ?? null,
          city: body.city ?? null,
          state: body.state ?? 'IN',
          mou_signed: true,
          mou_signed_at: body.signed_at ?? new Date().toISOString(),
          mou_version: body.mou_version ?? '2025-employer-01',
          is_active: true,
        });
      }
    } catch {
      // non-fatal — PDF still returns
    }
  }

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Elevate-MOU-${body.employer_name.replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': String(pdfBytes.length),
    },
  });
}
