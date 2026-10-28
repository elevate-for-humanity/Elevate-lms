// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user and active holder relationship before any acknowledgement write.
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { checkAndSendOnboardingCompleteEmail } from '@/lib/program-holder/onboarding-complete';

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const allowedTypes = ['handbook', 'rights', 'nda', 'non_compete', 'enchanted_hearts_referral_terms'];
  const types = allowedTypes.filter((type) => body[type] === true);
  if (!types.length)
    return NextResponse.json({ error: 'Select at least one agreement to sign.' }, { status: 400 });
  if (types.some(type => ['nda', 'non_compete'].includes(type))) {
    const { data: holder, error } = await ctx.db.from('program_holders')
      .select('features').eq('id', ctx.holderId).maybeSingle();
    if (error || !holder) return NextResponse.json({ error: 'Agreement readiness could not be checked. Please retry.' }, { status: 503 });
    if (holder.features?.full_forms_status === 'review_pending')
      return NextResponse.json({ error: 'Review your full MOU, NDA, and 12-month restriction forms. Signature is pending completed agreement details.', reviewUrl: '/program-holder/agreements' }, { status: 409 });
  }
  const requestHeaders = await headers();
  for (const documentType of types) {
    const { data: existing, error: lookupError } = await ctx.db
      .from('program_holder_acknowledgements')
      .select('id')
      .eq('user_id', ctx.user.id)
      .eq('document_type', documentType)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: 'Acknowledgements could not be checked.' }, { status: 503 });
    if (!existing) {
      const { error: insertError } = await ctx.db.from('program_holder_acknowledgements').insert({
        user_id: ctx.user.id,
        document_type: documentType,
        full_name: ctx.profile.full_name,
        title: 'Program Holder',
        ip_address: requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0',
        user_agent: requestHeaders.get('user-agent') || 'unknown',
      });
      if (insertError) return NextResponse.json({ error: 'Acknowledgement could not be saved. Please retry.' }, { status: 500 });
    }
  }
  await checkAndSendOnboardingCompleteEmail(ctx.db, ctx.user.id);
  return NextResponse.json({ ok: true });
}
