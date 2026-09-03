import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const PROGRAMS = new Set(['barber', 'cosmetology', 'esthetician', 'nail']);

function normalizeProgram(value: unknown): 'barber' | 'cosmetology' | 'esthetician' | 'nail' | null {
  const raw = String(value || '').trim().toLowerCase();
  if (raw.includes('barber')) return 'barber';
  if (raw.includes('cosmet')) return 'cosmetology';
  if (raw.includes('esthet')) return 'esthetician';
  if (raw.includes('nail')) return 'nail';
  return PROGRAMS.has(raw) ? (raw as 'barber' | 'cosmetology' | 'esthetician' | 'nail') : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const program = normalizeProgram(body.program);
  const signerName = String(body.signerName || '').trim().slice(0, 255);
  const signerTitle = String(body.signerTitle || '').trim().slice(0, 255);
  const agreed = body.agreed === true;

  if (!program || !signerName || !agreed) {
    return NextResponse.json({ ok: false, error: 'Program, authorized signer name, and agreement are required.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { data: link } = await db
    .from('partner_users')
    .select('partner_id, partners(id, name, contact_email, program_type, programs, approval_status, status)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!link?.partner_id || !link.partners) {
    return NextResponse.json({ ok: false, error: 'Active Host Shop access is required.' }, { status: 403 });
  }

  const partner = link.partners as any;
  const configuredPrograms = [
    normalizeProgram(partner.program_type),
    ...(Array.isArray(partner.programs) ? partner.programs.map(normalizeProgram) : []),
  ].filter(Boolean);

  if (configuredPrograms.length > 0 && !configuredPrograms.includes(program)) {
    return NextResponse.json({ ok: false, error: 'This Host Shop is not approved for the selected program.' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const signatureData = JSON.stringify({
    partnerId: link.partner_id,
    program,
    signerName,
    signerTitle: signerTitle || null,
    signedAt: now,
  });

  const { data: existing } = await db
    .from('mou_signatures')
    .select('id')
    .eq('user_id', user.id)
    .eq('partner_type', program)
    .eq('organization_name', partner.name || '')
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await db.from('mou_signatures').insert({
      user_id: user.id,
      signature_data: signatureData,
      signer_name: signerName,
      signer_title: signerTitle || null,
      contact_name: signerName,
      contact_title: signerTitle || null,
      contact_email: partner.contact_email || user.email || null,
      organization_name: partner.name || 'Host Shop',
      partner_type: program,
      digital_signature: signerName,
      agreed: true,
      agreed_at: now,
      signed_at: now,
      mou_version: `host-shop-${program}-2026-08`,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      user_agent: request.headers.get('user-agent') || null,
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: `Unable to save MOU signature: ${insertError.message}` }, { status: 500 });
    }
  }

  const { error: partnerError } = await db
    .from('partners')
    .update({ mou_signed: true, mou_signed_at: now })
    .eq('id', link.partner_id);

  if (partnerError) {
    return NextResponse.json({ ok: false, error: `Signature saved, but Host Shop status could not be updated: ${partnerError.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
