import { getUploadedW9Status } from '@/lib/program-holder/document-review';
import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { quickBooksInvitationUrl, payoutSetupNotes } from '@/lib/program-holder/payout-account';

export const dynamic = 'force-dynamic';
async function authorize(request: Request) {
  const guard = await apiRequireAdmin(request);
  if (guard.error) return { error: guard.error };
  if (!guard.effectiveRoles.some(role => ['admin','super_admin'].includes(role))) return { error: NextResponse.json({ error: 'Administrator banking access required.' }, { status: 403 }) };
  return { actor: guard.id, db: await requireAdminClient() };
}
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request); if (auth.error) return auth.error;
  const { id } = await params;
  const { data: holder, error } = await auth.db!.from('program_holders').select('user_id').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Banking review could not load.' }, { status: 503 });
  if (!holder?.user_id) return NextResponse.json({ error: 'A linked Program Holder login is required.' }, { status: 409 });
  const { data: payout, error: payoutError } = await auth.db!.from('program_holder_payouts').select('payout_provider,provider_recipient_id,paypal_recipient_email,verification_status,verified_at,notes').eq('user_id', holder.user_id).maybeSingle();
  if (payoutError) return NextResponse.json({ error: 'Banking review could not load.' }, { status: 503 });
  let uploadedW9;
  try { uploadedW9 = await getUploadedW9Status(auth.db!, holder.user_id); }
  catch { return NextResponse.json({ error: 'Uploaded W-9 review could not be verified.' }, { status: 503 }); }
  const { notes, ...summary } = payout || {};
  return NextResponse.json({ uploadedW9, payout: payout ? summary : null, invitationUrl: quickBooksInvitationUrl(payoutSetupNotes(notes).quickbooks_invitation_url) || '' }, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await applyRateLimit(request, 'payment'); if (limited) return limited;
  const auth = await authorize(request); if (auth.error) return auth.error;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const db = auth.db!;
  const { data: holder, error } = await db.from('program_holders').select('user_id,features,updated_at').eq('id', id).maybeSingle();
  if (error || !holder?.user_id) return NextResponse.json({ error: 'Linked Program Holder could not be verified.' }, { status: 409 });
  if (body.action === 'save_invitation') {
    const url = quickBooksInvitationUrl(body.url);
    if (!url) return NextResponse.json({ error: 'Use the holder’s actual HTTPS invitation on an Intuit or QuickBooks domain.' }, { status: 400 });
    const { data: current, error: lookupError } = await db.from('program_holder_payouts').select('notes,updated_at').eq('user_id', holder.user_id).maybeSingle();
    if (lookupError) return NextResponse.json({ error: 'Payout settings could not load.' }, { status: 503 });
    const values = { notes: JSON.stringify({ ...payoutSetupNotes(current?.notes), quickbooks_invitation_url: url }), updated_at: new Date().toISOString() };
    let update = current ? db.from('program_holder_payouts').update(values).eq('user_id', holder.user_id)
      : db.from('program_holder_payouts').insert({ user_id: holder.user_id, payout_provider: 'quickbooks', ...values });
    if (current) update = current.updated_at ? update.eq('updated_at', current.updated_at) : update.is('updated_at', null);
    const { data: saved, error: saveError } = await update.select('user_id').maybeSingle();
    if (saveError || !saved) return NextResponse.json({ error: 'Payout settings changed. Reload before saving the invitation.' }, { status: 409 });
    return NextResponse.json({ ok: true });
  }
  if (body.action !== 'confirm_setup' || !['paypal','quickbooks'].includes(body.provider) || body.confirmed !== true) return NextResponse.json({ error: 'Confirm the actual provider setup before verification.' }, { status: 400 });
  const reference = String(body.reference || '').trim();
  if (reference.length < 3 || reference.length > 120 || /[\r\n]/.test(reference)) return NextResponse.json({ error: 'Enter the provider verification reference, not bank details.' }, { status: 400 });
  const { data: payout, error: lookupError } = await db.from('program_holder_payouts').select('payout_provider,provider_recipient_id,paypal_recipient_email,notes,updated_at').eq('user_id', holder.user_id).maybeSingle();
  if (lookupError || payout?.payout_provider !== body.provider) return NextResponse.json({ error: 'The holder must select this provider and save their destination first.' }, { status: 409 });
  if (body.provider === 'paypal' && (!payout.paypal_recipient_email || payout.provider_recipient_id !== payout.paypal_recipient_email)) return NextResponse.json({ error: 'A consistent PayPal recipient email is required.' }, { status: 409 });
  const now = new Date().toISOString();
  let update = db.from('program_holder_payouts').update({ verification_status: 'active', payouts_enabled: true, transfers_enabled: true,
    verified_at: now, verified_by: auth.actor, notes: JSON.stringify({ ...payoutSetupNotes(payout.notes), verification_reference: reference }), ...(body.provider === 'quickbooks' ? { provider_recipient_id: reference, quickbooks_sync_status: 'connected' } : {}), updated_at: now })
    .eq('user_id', holder.user_id).eq('payout_provider', body.provider);
  update = payout.updated_at ? update.eq('updated_at', payout.updated_at) : update.is('updated_at', null);
  const { data: saved, error: saveError } = await update.select('user_id').maybeSingle();
  if (saveError || !saved) return NextResponse.json({ error: 'Destination changed during review. Reload and recheck it.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
