import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError, safeInternalError } from '@/lib/api/safe-error';
import { generateEmployerMOUPdf } from '@/lib/documents/generate-employer-mou-pdf';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

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
      industry: body.industry ?? undefined,
      city: body.city ?? undefined,
      state: body.state ?? 'IN',
      programs: body.programs ?? [],
      signed_at: body.signed_at ?? new Date().toISOString(),
      signature_data: body.signature_data ?? undefined,
      ip_address: request.headers.get('x-forwarded-for') ?? undefined,
      mou_version: body.mou_version ?? '2025-employer-01',
    });
  } catch (err) {
    return safeInternalError(err, 'Employer MOU PDF generation failed');
  }

  // Persist MOU status to partners table if partner_id provided
  if (body.partner_id) {
    const db = await requireAdminClient();
    if (db) {
      await db
        .from('partners')
        .update({
          mou_signed: true,
          mou_signed_at: body.signed_at ?? new Date().toISOString(),
          mou_version: body.mou_version ?? '2025-employer-01',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.partner_id);
    }
  }

  // Optionally create a new partner record if no partner_id
  if (!body.partner_id && body.create_partner) {
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
  }

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Employer-MOU-${body.employer_name.replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': String(pdfBytes.length),
    },
  });
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { searchParams } = new URL(request.url);
  const signed = searchParams.get('signed');

  let query = db
    .from('partners')
    .select('id, name, partner_type, contact_name, contact_email, mou_signed, mou_signed_at, mou_version, city, state, is_active, created_at')
    .eq('partner_type', 'employer')
    .order('created_at', { ascending: false });

  if (signed === 'true') query = query.eq('mou_signed', true);
  if (signed === 'false') query = query.eq('mou_signed', false);

  const { data, error } = await query;
  if (error) return safeDbError(error, 'Failed to fetch employer partners');

  return NextResponse.json({ partners: data ?? [] });
}
