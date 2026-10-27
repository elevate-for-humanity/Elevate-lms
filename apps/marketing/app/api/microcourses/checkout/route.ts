import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { paymentRateLimit } from '@/lib/rate-limit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CheckoutInput = z.object({
  slugs: z
    .array(z.string().regex(/^[a-z0-9-]+$/))
    .min(1)
    .max(20)
    .transform((items) => [...new Set(items)]),
  checkoutAttemptId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    if (paymentRateLimit) {
      const ip =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const limiter = paymentRateLimit.get();
      const { success } = limiter ? await limiter.limit(ip) : { success: true };
      if (!success)
        return NextResponse.json({ error: 'Too many checkout attempts' }, { status: 429 });
    }
    const parsed = CheckoutInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Select between 1 and 20 valid microcourses.' },
        { status: 400 },
      );
    const admin = await requireAdminClient();
    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user?.id || !user.email)
      return NextResponse.json(
        { error: 'Sign in before purchasing a microcourse.' },
        { status: 401 },
      );
    const { data: courses, error: courseError } = await admin
      .from('microcourses')
      .select(
        'id,slug,title,description,provider_id,provider_cost_cents,retail_price_cents,currency,status',
      )
      .in('slug', parsed.data.slugs)
      .eq('status', 'active');
    if (courseError) throw courseError;
    if (!courses || courses.length !== parsed.data.slugs.length)
      return NextResponse.json(
        { error: 'One or more selected microcourses are unavailable.' },
        { status: 409 },
      );
    const providerIds = [...new Set(courses.map((course) => course.provider_id))];
    const { data: providers, error: providerError } = await admin
      .from('microcourse_providers')
      .select('id,active')
      .in('id', providerIds);
    if (providerError) throw providerError;
    const activeProviders = new Set(
      (providers || []).filter((provider) => provider.active).map((provider) => provider.id),
    );
    const unavailable = courses.find((course) => !activeProviders.has(course.provider_id));
    if (unavailable)
      return NextResponse.json(
        { error: `${unavailable.title} is not available from its provider.` },
        { status: 409 },
      );
    if (courses.some((course) => String(course.currency).toLowerCase() !== 'usd'))
      return NextResponse.json(
        { error: 'QuickBooks checkout currently supports USD microcourses.' },
        { status: 409 },
      );

    const retailTotal = courses.reduce((sum, course) => sum + course.retail_price_cents, 0);
    const providerTotal = courses.reduce((sum, course) => sum + course.provider_cost_cents, 0);
    const { data: existing } = await admin
      .from('microcourse_orders')
      .select('id,retail_total_cents')
      .eq('checkout_attempt_id', parsed.data.checkoutAttemptId)
      .maybeSingle();
    if (existing && Number(existing.retail_total_cents) !== retailTotal)
      return NextResponse.json(
        { error: 'This checkout attempt belongs to a different cart.' },
        { status: 409 },
      );
    const orderId = existing?.id || crypto.randomUUID();
    if (!existing) {
      const order = await admin.from('microcourse_orders').insert({
        id: orderId,
        user_id: user.id,
        customer_email: user.email.toLowerCase(),
        currency: 'usd',
        retail_total_cents: retailTotal,
        provider_total_cents: providerTotal,
        transfer_group: `merchant_order_${orderId}`,
        billing_provider: 'quickbooks',
        checkout_attempt_id: parsed.data.checkoutAttemptId,
        status: 'awaiting_payment',
      });
      if (order.error) throw order.error;
      const items = await admin.from('microcourse_order_items').insert(
        courses.map((course) => ({
          order_id: orderId,
          microcourse_id: course.id,
          provider_id: course.provider_id,
          title_snapshot: course.title,
          provider_cost_cents: course.provider_cost_cents,
          retail_price_cents: course.retail_price_cents,
        })),
      );
      if (items.error) {
        await admin.from('microcourse_orders').update({ status: 'failed' }).eq('id', orderId);
        throw items.error;
      }
    }
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const invoice = await createQuickBooksBillingProvider(admin).createManualInvoice({
      idempotencyKey: `microcourse-order:${orderId}`,
      customer: {
        externalKey: `user:${user.id}`,
        displayName: profile?.full_name || user.email,
        email: user.email,
      },
      lines: courses.map((course) => ({
        canonicalKey: `microcourse-${course.slug}`,
        name: course.title,
        description: course.description || undefined,
        quantity: 1,
        unitAmountCents: course.retail_price_cents,
      })),
      dueDate: new Date().toISOString().slice(0, 10),
      memo: `Elevate microcourse order ${orderId}`,
      fulfillment: {
        type: 'microcourse_purchase',
        payload: {
          microcourse_order_id: orderId,
          user_id: user.id,
          customer_email: user.email,
          amount_cents: retailTotal,
        },
      },
    });
    if (!invoice.paymentUrl)
      throw new Error('QuickBooks created the invoice but online payment links are not enabled.');
    await admin
      .from('microcourse_orders')
      .update({
        provider_invoice_id: invoice.providerInvoiceId,
        status: 'awaiting_payment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    return NextResponse.json({
      url: invoice.paymentUrl,
      orderId,
      invoiceId: invoice.providerInvoiceId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout is unavailable' },
      { status: 500 },
    );
  }
}
