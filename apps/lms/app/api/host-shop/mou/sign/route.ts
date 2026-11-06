import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { recordMouSignature } from '@/lib/signatures/electronic-signature-service';
import { hostShopMouSnapshot } from '@/lib/partners/host-shop-mou-snapshot';
import { getHostShopMouMeta } from '@/lib/partners/host-shop-mou-sections';

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
    .select('partner_id, partners(id, name, contact_email, program_type, programs, approval_status, status, mou_version)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!link?.partner_id || !link.partners) {
    return NextResponse.json({ ok: false, error: 'Active Host Shop access is required.' }, { status: 403 });
  }

  const partner = link.partners as any;
  if (partner.status !== 'active' || !['approved', 'pending'].includes(partner.approval_status || '')) {
    return NextResponse.json({ ok: false, error: 'Active Host Shop onboarding access is required.' }, { status: 403 });
  }
  const configuredPrograms = [
    normalizeProgram(partner.program_type),
    ...(Array.isArray(partner.programs) ? partner.programs.map(normalizeProgram) : []),
  ].filter(Boolean);

  if (configuredPrograms.length > 0 && !configuredPrograms.includes(program)) {
    return NextResponse.json({ ok: false, error: 'This Host Shop is not approved for the selected program.' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const meta = getHostShopMouMeta(program);
  const authorityVersion = meta.registered && meta.rapidsId ? meta.rapidsId : `${program}-host-site-pathway`;
  const mouVersion = partner.mou_version || `${authorityVersion}-2026-08`;

  const { data: existing, error: lookupError } = await db
    .from('mou_signatures')
    .select('id,signed_at,mou_version')
    .eq('user_id', user.id)
    .eq('partner_type', program)
    .eq('organization_name', partner.name || '')
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ ok: false, error: 'Agreement records could not be checked. Retry later.' }, { status: 503 });
  if (!existing) {
    try {
      await recordMouSignature(db, {
        userId: user.id, signerName, signerTitle, organizationName: partner.name || 'Host Shop',
        contactEmail: partner.contact_email || user.email || null,
        partnerType: program, documentVersion: mouVersion, signedAt: now,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: request.headers.get('user-agent') || null,
        payload: hostShopMouSnapshot({ partnerId: link.partner_id, organizationName: partner.name || 'Host Shop', program, documentVersion: mouVersion, signerName, signerTitle, signedAt: now }),
      });
    } catch {
      return NextResponse.json({ ok: false, error: 'Unable to save the signed agreement. Please retry.' }, { status: 503 });
    }
  }

  const { error: partnerError } = await db
    .from('partners')
    .update({ mou_signed: true, mou_signed_at: existing?.signed_at || now, mou_version: existing?.mou_version || mouVersion })
    .eq('id', link.partner_id);

  if (partnerError) {
    return NextResponse.json({ ok: false, error: `Signature saved, but Host Shop status could not be updated: ${partnerError.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
