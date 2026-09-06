import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeWriteClient } from '@/lib/stripe/client';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveStripeCustomer } from '@/lib/stripe/customer-resolver';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'payment');
  if (rateLimited) return rateLimited;
  await hydrateProcessEnv();
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const admin = await requireAdminClient();
    const [{ data: billingCustomer }, { data: profile }, { data: enrollment }] = await Promise.all([
      admin
        .from('user_billing_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle(),
      admin.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle(),
      admin
        .from('program_enrollments')
        .select('id,stripe_customer_id')
        .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
        .not('stripe_customer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const stripe = getStripeWriteClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const { customer } = await resolveStripeCustomer({
      stripe,
      email: user.email || '',
      candidateIds: [
        billingCustomer?.stripe_customer_id,
        enrollment?.stripe_customer_id,
        profile?.stripe_customer_id,
      ],
    });
    if (!customer) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }
    if (enrollment && enrollment.stripe_customer_id !== customer.id) {
      await admin
        .from('program_enrollments')
        .update({ stripe_customer_id: customer.id })
        .eq('id', enrollment.id);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${(
        process.env.NEXT_PUBLIC_LMS_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://app.elevateforhumanity.org'
      ).replace(/\/$/, '')}/apprentice/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create billing session' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/billing/portal', _POST);
