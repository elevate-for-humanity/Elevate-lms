// pre-auth-registry: exempt - requireProgramHolder and the holder-scoped enrollment authorize invitations.
import { NextRequest, NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendEmail } from '@/lib/email/sendgrid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const enrollmentId = typeof body?.enrollmentId === 'string' ? body.enrollmentId : '';
  if (!enrollmentId) return NextResponse.json({ error: 'Student enrollment is required.' }, { status: 400 });
  const { data: enrollment, error: enrollmentError } = await ctx.db
    .from('program_enrollments')
    .select('id,user_id,status,enrollment_state')
    .eq('id', enrollmentId)
    .eq('program_holder_id', ctx.holderId)
    .maybeSingle();
  if (enrollmentError) return NextResponse.json({ error: 'Unable to verify student assignment.' }, { status: 503 });
  if (!enrollment?.user_id) return NextResponse.json({ error: 'An assigned student portal account is required. Ask admissions to complete account provisioning.' }, { status: 404 });
  if (['revoked', 'suspended', 'withdrawn', 'cancelled'].includes(enrollment.enrollment_state || enrollment.status)) {
    return NextResponse.json({ error: 'This enrollment is not eligible for a portal invitation.' }, { status: 403 });
  }
  const { data: profile, error: profileError } = await ctx.db
    .from('profiles').select('email,role').eq('id', enrollment.user_id).maybeSingle();
  if (profileError) return NextResponse.json({ error: 'Unable to verify student account.' }, { status: 503 });
  if (!profile?.email || profile.role !== 'student') {
    return NextResponse.json({ error: 'A student email account is required.' }, { status: 400 });
  }
  const { data: authAccount, error: accountError } = await ctx.db.auth.admin.getUserById(enrollment.user_id);
  if (accountError || !authAccount?.user?.email ||
      authAccount.user.email.toLowerCase() !== profile.email.toLowerCase()) {
    return NextResponse.json({ error: 'The student sign-in account needs admissions review.' }, { status: 409 });
  }
  // Invite only an existing, verified assignment. This does not create an account,
  // change a password, grant a role, or bypass admission/onboarding requirements.
  const { data: link, error: linkError } = await ctx.db.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.email,
    options: { redirectTo: 'https://app.elevateforhumanity.org/auth/callback?redirect=/learner/dashboard' },
  });
  if (linkError || !link?.properties?.action_link) {
    return NextResponse.json({ error: 'Unable to create the secure student invitation.' }, { status: 503 });
  }
  const invitationUrl = link.properties.action_link;
  const escapedUrl = invitationUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  try {
    const delivery = await sendEmail({
      to: profile.email,
      replyTo: ctx.profile.email || undefined,
      subject: 'Your Elevate Student Portal invitation',
      text: `Your Program Holder invited you to open your Elevate Student Portal. Use this secure sign-in link: ${invitationUrl}\n\nComplete any onboarding steps shown in your dashboard. You can also sign in at https://app.elevateforhumanity.org/login using your existing account.`,
      html: `<p>Your Program Holder invited you to open your Elevate Student Portal.</p><p><a href="${escapedUrl}">Open your Student Portal</a></p><p>Complete any onboarding steps shown in your dashboard. You can also sign in at https://app.elevateforhumanity.org/login using your existing account.</p>`,
      singleAttempt: true,
    });
    if (!delivery.success) return NextResponse.json({ error: 'The invitation email was not accepted for delivery. Please retry later.' }, { status: 502 });
    return NextResponse.json({ ok: true, delivery: 'accepted' });
  } catch {
    return NextResponse.json({ error: 'The invitation email service is unavailable. Please retry later.' }, { status: 502 });
  }
}
