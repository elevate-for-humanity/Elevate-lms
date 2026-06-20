import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError, safeInternalError } from '@/lib/api/safe-error';
import { generateCDLMOUPdf } from '@/lib/documents/generate-cdl-mou-pdf';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.company_name || !body?.signer_name || !body?.signer_title) {
    return safeError('company_name, signer_name, and signer_title are required', 400);
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateCDLMOUPdf({
      company_name: body.company_name,
      signer_name: body.signer_name,
      signer_title: body.signer_title,
      dot_number: body.dot_number ?? undefined,
      mc_number: body.mc_number ?? undefined,
      cdl_class: body.cdl_class ?? 'A',
      training_site_address: body.training_site_address ?? undefined,
      contact_email: body.contact_email ?? undefined,
      contact_phone: body.contact_phone ?? undefined,
      signed_at: body.signed_at ?? new Date().toISOString(),
      signature_data: body.signature_data ?? undefined,
      ip_address: request.headers.get('x-forwarded-for') ?? undefined,
      mou_version: body.mou_version ?? '2025-cdl-01',
    });
  } catch (err) {
    return safeInternalError(err, 'CDL MOU PDF generation failed');
  }

  // Optionally persist to partners table
  if (body.partner_id) {
    const db = await requireAdminClient();
    if (db) {
      await db
        .from('partners')
        .update({
          mou_signed: true,
          mou_signed_at: body.signed_at ?? new Date().toISOString(),
          mou_version: body.mou_version ?? '2025-cdl-01',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.partner_id);
    }
  }

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="CDL-MOU-${body.company_name.replace(/\s+/g, '-')}.pdf"`,
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

  // Return CDL partners with MOU status
  const { data, error } = await db
    .from('partners')
    .select('id, name, contact_name, contact_email, mou_signed, mou_signed_at, mou_version, partner_type_detail, city, state, created_at')
    .eq('partner_type', 'employer')
    .eq('partner_type_detail', 'cdl_transportation')
    .order('created_at', { ascending: false });

  if (error) return safeDbError(error, 'Failed to fetch CDL partners');
  return NextResponse.json({ partners: data ?? [] });
}
