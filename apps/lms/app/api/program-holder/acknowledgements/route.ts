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
  const types = ['handbook', 'rights', 'non_compete'].filter((type) => body[type] === true);
  if (types.length !== 3)
    return NextResponse.json({ error: 'All three acknowledgements are required.' }, { status: 400 });
  const requestHeaders = await headers();
  for (const documentType of types) {
    const { data: existing } = await ctx.db
      .from('program_holder_acknowledgements')
      .select('id')
      .eq('user_id', ctx.user.id)
      .eq('document_type', documentType)
      .maybeSingle();
    if (!existing)
      await ctx.db
        .from('program_holder_acknowledgements')
        .insert({
          user_id: ctx.user.id,
          document_type: documentType,
          full_name: ctx.profile.full_name,
          title: 'Program Holder',
          ip_address: requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0',
          user_agent: requestHeaders.get('user-agent') || 'unknown',
        });
  }
  await checkAndSendOnboardingCompleteEmail(ctx.db, ctx.user.id);
  return NextResponse.json({ ok: true });
}
