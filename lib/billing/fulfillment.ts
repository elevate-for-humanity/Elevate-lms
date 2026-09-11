import 'server-only';
import { randomBytes } from 'node:crypto';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { syncLicenseFromSaasEntitlements } from '@/lib/platform/sync-license-from-saas';
import type { BasePlanId, BillingInterval } from '@/lib/store/platform-pricing';

type Database = any;

function confirmationCode(): string {
  return randomBytes(6).toString('base64url').toUpperCase().slice(0, 8);
}

export async function fulfillPaidBillingInvoice(
  db: Database,
  job: { billing_invoice_id: string; fulfillment_type: string; payload: any },
) {
  const payload = job.payload || {};
  if (job.fulfillment_type === 'tuition_payment') {
    const payment = await db.from('payment_logs').upsert(
      {
        user_id: payload.user_id,
        student_id: payload.user_id,
        amount: Number(payload.amount_cents),
        currency: 'usd',
        status: 'completed',
        payment_option: 'quickbooks_invoice',
        payment_type: 'tuition_installment',
        program_slug: payload.program_slug,
        billing_provider: 'quickbooks',
        billing_invoice_id: job.billing_invoice_id,
        completed_at: new Date().toISOString(),
        metadata: {
          program_enrollment_id: payload.enrollment_id,
          legacy_stripe_subscription_id: payload.legacy_stripe_subscription_id,
        },
      },
      { onConflict: 'billing_invoice_id' },
    );
    if (payment.error) throw new Error(payment.error.message);
    const enrollment = await db
      .from('program_enrollments')
      .update({
        billing_provider: 'quickbooks',
        provider_subscription_id: payload.schedule_reference,
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.enrollment_id);
    if (enrollment.error) throw new Error(enrollment.error.message);
    return;
  }
  if (job.fulfillment_type === 'tenant_offer') {
    const { data: order, error: orderError } = await db
      .from('tenant_orders')
      .select('id,status,amount_total,currency,tenant_id,offer_id')
      .eq('id', payload.tenant_order_id)
      .maybeSingle();
    if (orderError || !order)
      throw new Error(orderError?.message || 'Tenant marketplace order was not found.');
    if (
      Number(order.amount_total) !== Number(payload.amount_cents) ||
      order.offer_id !== payload.offer_id
    )
      throw new Error('Tenant marketplace payment does not match its order snapshot.');
    const feeCents = Math.floor(
      (Number(order.amount_total) * Number(payload.platform_fee_bps || 0)) / 10_000,
    );
    const payable = await db.from('provider_payables').upsert(
      {
        billing_invoice_id: job.billing_invoice_id,
        source_type: 'tenant_offer',
        source_order_id: order.id,
        source_item_id: '00000000-0000-0000-0000-000000000000',
        provider_id: payload.provider_id,
        gross_amount_cents: Number(order.amount_total),
        platform_fee_cents: feeCents,
        payable_amount_cents: Number(order.amount_total) - feeCents,
        currency: String(order.currency || 'usd').toLowerCase(),
        status: 'pending',
        metadata: { tenant_id: order.tenant_id, offer_id: order.offer_id },
      },
      { onConflict: 'billing_invoice_id,source_type,source_order_id,source_item_id' },
    );
    if (payable.error) throw new Error(payable.error.message);
    await db
      .from('tenant_orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .in('status', ['pending', 'open', 'failed']);
    const { data: offer } = await db
      .from('tenant_offers')
      .select('access_config')
      .eq('id', order.offer_id)
      .maybeSingle();
    const accessConfig =
      offer?.access_config && typeof offer.access_config === 'object'
        ? (offer.access_config as Record<string, unknown>)
        : {};
    const planId =
      typeof accessConfig.community_plan_id === 'string' ? accessConfig.community_plan_id : null;
    if (planId && payload.customer_email) {
      const { data: user } = await db
        .from('profiles')
        .select('id')
        .ilike('email', payload.customer_email)
        .maybeSingle();
      if (user?.id) {
        let memberId: string | null = null;
        const existingMember = await db
          .from('community_members')
          .select('id')
          .eq('tenant_id', order.tenant_id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (existingMember.error) throw new Error(existingMember.error.message);
        if (existingMember.data?.id) memberId = existingMember.data.id;
        else {
          const createdMember = await db
            .from('community_members')
            .insert({
              tenant_id: order.tenant_id,
              user_id: user.id,
              role: 'member',
              status: 'active',
            })
            .select('id')
            .single();
          if (createdMember.error) throw new Error(createdMember.error.message);
          memberId = createdMember.data.id;
        }
        const accessRow = {
          tenant_id: order.tenant_id,
          member_id: memberId,
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          stripe_subscription_id: null,
          metadata: {
            billing_provider: 'quickbooks',
            billing_invoice_id: job.billing_invoice_id,
            customer_email: payload.customer_email,
          },
          updated_at: new Date().toISOString(),
        };
        const priorAccess = await db
          .from('community_member_access')
          .select('id')
          .eq('tenant_id', order.tenant_id)
          .eq('user_id', user.id)
          .eq('plan_id', planId)
          .maybeSingle();
        if (priorAccess.error) throw new Error(priorAccess.error.message);
        const access = priorAccess.data?.id
          ? await db.from('community_member_access').update(accessRow).eq('id', priorAccess.data.id)
          : await db.from('community_member_access').insert(accessRow);
        if (access.error) throw new Error(access.error.message);
      }
    }
    return;
  }

  if (job.fulfillment_type === 'microcourse_purchase') {
    const { data: order, error: orderError } = await db
      .from('microcourse_orders')
      .select('*')
      .eq('id', payload.microcourse_order_id)
      .maybeSingle();
    if (orderError || !order)
      throw new Error(orderError?.message || 'Microcourse order was not found.');
    if (
      Number(order.retail_total_cents) !== Number(payload.amount_cents) ||
      order.user_id !== payload.user_id
    )
      throw new Error('Microcourse payment does not match its order snapshot.');
    const { data: items, error: itemsError } = await db
      .from('microcourse_order_items')
      .select('*')
      .eq('order_id', order.id);
    if (itemsError || !items?.length)
      throw new Error(itemsError?.message || 'Microcourse order items were not found.');
    for (const item of items) {
      const payable = await db.from('provider_payables').upsert(
        {
          billing_invoice_id: job.billing_invoice_id,
          source_type: 'microcourse',
          source_order_id: order.id,
          source_item_id: item.id,
          provider_id: item.provider_id,
          gross_amount_cents: Number(item.retail_price_cents),
          platform_fee_cents: Number(item.retail_price_cents) - Number(item.provider_cost_cents),
          payable_amount_cents: Number(item.provider_cost_cents),
          currency: String(order.currency || 'usd').toLowerCase(),
          status: 'pending',
          metadata: { microcourse_id: item.microcourse_id },
        },
        { onConflict: 'billing_invoice_id,source_type,source_order_id,source_item_id' },
      );
      if (payable.error) throw new Error(payable.error.message);
      const updated = await db
        .from('microcourse_order_items')
        .update({ transfer_status: 'pending', access_status: 'ready' })
        .eq('id', item.id);
      if (updated.error) throw new Error(updated.error.message);
    }
    const paid = await db
      .from('microcourse_orders')
      .update({
        status: 'access_ready',
        access_status: 'ready',
        paid_at: order.paid_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .in('status', ['awaiting_payment', 'paid', 'provider_transfer_pending', 'failed']);
    if (paid.error) throw new Error(paid.error.message);
    return;
  }

  if (job.fulfillment_type === 'donation_receipt') {
    const result = await db.from('donations').insert({
      donor_name: payload.donor_name,
      donor_email: payload.donor_email,
      amount: Number(payload.amount_cents || 0) / 100,
      currency: 'usd',
      payment_status: 'paid',
      is_recurring: Boolean(payload.recurring),
      recurring_frequency: payload.recurring ? 'monthly' : null,
      metadata: {
        billing_invoice_id: job.billing_invoice_id,
        provider: 'quickbooks',
        dedication: payload.dedication,
        in_honor_of: payload.in_honor_of,
      },
    });
    if (result.error) throw new Error(result.error.message);
    return;
  }

  if (job.fulfillment_type === 'testing_booking') {
    const names = String(payload.customer_name || 'Customer')
      .trim()
      .split(/\s+/);
    const firstName = names.shift() || 'Customer';
    const lastName = names.join(' ');
    const result = await db.from('exam_bookings').insert({
      exam_type: payload.exam_type,
      exam_name: payload.exam_name,
      booking_type: payload.booking_type,
      first_name: firstName,
      last_name: lastName,
      email: payload.customer_email,
      participant_count: payload.participant_count,
      status: 'pending',
      payment_status: 'paid',
      fee_cents: payload.amount_cents,
      confirmation_code: confirmationCode(),
      add_on: Boolean(payload.add_on),
      add_on_paid: Boolean(payload.add_on),
      slot_id: payload.slot_id,
      provider: 'quickbooks',
      provider_invoice_id: job.billing_invoice_id,
    });
    if (result.error) throw new Error(result.error.message);
    if (payload.slot_id) await db.rpc('increment_slot_booked_count', { slot_id: payload.slot_id });
    return;
  }

  if (job.fulfillment_type === 'program_enrollment') {
    const result = await db
      .from('program_enrollments')
      .update({
        status: 'active',
        payment_status: 'paid',
        enrollment_state: 'active',
        next_required_action: 'ONBOARDING',
        amount_paid_cents: payload.amount_cents,
        billing_provider: 'quickbooks',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.enrollment_id)
      .eq('payment_status', 'pending');
    if (result.error) throw new Error(result.error.message);
    return;
  }

  if (job.fulfillment_type === 'store_order') {
    const { data: order, error: orderError } = await db
      .from('store_orders')
      .select('id,user_id,status,total_cents,items')
      .eq('id', payload.store_order_id)
      .maybeSingle();
    if (orderError || !order) throw new Error(orderError?.message || 'Store order was not found.');
    if (order.status === 'paid') return;
    if (
      order.status !== 'pending' ||
      order.user_id !== payload.user_id ||
      Number(order.total_cents) !== Number(payload.amount_cents)
    )
      throw new Error('Store order payment does not match its pending snapshot.');
    const now = new Date().toISOString();
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items.filter((row: any) => !row.requires_shipping)) {
      const values = {
        name: item.name,
        description: `Store purchase: ${item.name}`,
        status: 'active',
        entitlement_type: item.type || 'store_product',
        granted_at: now,
        billing_provider: 'quickbooks',
        provider_payment_id: job.billing_invoice_id,
        updated_at: now,
      };
      const existing = await db
        .from('user_entitlements')
        .select('id')
        .eq('user_id', order.user_id)
        .eq('product_id', item.product_id)
        .maybeSingle();
      const entitlement = existing.data?.id
        ? await db.from('user_entitlements').update(values).eq('id', existing.data.id)
        : await db
            .from('user_entitlements')
            .insert({ user_id: order.user_id, product_id: item.product_id, ...values });
      if (entitlement.error) throw new Error(entitlement.error.message);
    }
    const paid = await db
      .from('store_orders')
      .update({
        status: 'paid',
        shipping_address: payload.shipping_address || {},
        notes: `QuickBooks payment confirmed ${now}`,
        updated_at: now,
      })
      .eq('id', order.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (paid.error || !paid.data)
      throw new Error(paid.error?.message || 'Store order was already changed.');
    await db
      .from('cart_items')
      .delete()
      .eq('user_id', order.user_id)
      .in(
        'product_id',
        items.map((item: any) => item.product_id),
      );
    for (const item of items.filter((row: any) => row.track_inventory)) {
      const product = await db
        .from('products')
        .select('inventory_quantity')
        .eq('id', item.product_id)
        .maybeSingle();
      if (product.data?.inventory_quantity != null)
        await db
          .from('products')
          .update({
            inventory_quantity: Math.max(
              0,
              Number(product.data.inventory_quantity) - Number(item.quantity || 0),
            ),
          })
          .eq('id', item.product_id)
          .eq('inventory_quantity', product.data.inventory_quantity);
    }
    return;
  }

  if (job.fulfillment_type === 'platform_subscription') {
    const now = new Date();
    const interval = payload.billing_interval as BillingInterval;
    const periodEnd = new Date(now);
    if (interval === 'annual') periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
    else periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
    const plan = await db
      .from('subscription_plans')
      .select('id,slug')
      .eq('slug', payload.plan_id)
      .eq('active', true)
      .maybeSingle();
    if (!plan.data?.id) throw new Error('The platform subscription plan is not active.');
    const subscription = await db.from('organization_subscriptions').upsert(
      {
        organization_id: payload.organization_id,
        plan_id: plan.data.id,
        plan_type: payload.plan_id,
        billing_interval: interval,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        billing_provider: 'quickbooks',
        provider_subscription_id: `schedule:${payload.organization_id}:platform-subscription`,
        metadata: {
          tenant_id: payload.tenant_id,
          addon_codes: payload.addon_codes || [],
          billing_access: true,
        },
        updated_at: now.toISOString(),
      },
      { onConflict: 'organization_id' },
    );
    if (subscription.error) throw new Error(subscription.error.message);
    await db
      .from('addon_subscriptions')
      .update({ active: false, canceled_at: now.toISOString(), updated_at: now.toISOString() })
      .eq('organization_id', payload.organization_id);
    for (const code of payload.addon_codes || []) {
      const addon = await db
        .from('saas_addon_catalog')
        .select('monthly_price')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle();
      if (!addon.data) throw new Error(`Unknown platform add-on: ${code}`);
      const saved = await db.from('addon_subscriptions').upsert(
        {
          organization_id: payload.organization_id,
          addon_code: code,
          monthly_price: addon.data.monthly_price,
          active: true,
          activated_at: now.toISOString(),
          canceled_at: null,
          updated_at: now.toISOString(),
          metadata: { billing_provider: 'quickbooks' },
        },
        { onConflict: 'organization_id,addon_code' },
      );
      if (saved.error) throw new Error(saved.error.message);
    }
    const entitlements = await getOrganizationFeatures(payload.organization_id, db);
    await syncLicenseFromSaasEntitlements(db, payload.organization_id, entitlements, {
      planSlug: payload.plan_id as BasePlanId,
      billingInterval: interval,
      active: true,
    });
    await db
      .from('licenses')
      .update({
        billing_provider: 'quickbooks',
        provider_subscription_id: `schedule:${payload.organization_id}:platform-subscription`,
      })
      .eq('tenant_id', payload.organization_id);
    return;
  }

  if (job.fulfillment_type === 'host_shop_subscription') {
    const now = new Date().toISOString();
    const result = await db
      .from('host_shop_partnerships')
      .update({
        partner_tier: payload.tier,
        subscription_status: 'active',
        status: 'active',
        portal_access_enabled: true,
        billing_provider: 'quickbooks',
        provider_subscription_id: `schedule:partner:${payload.partner_id}:host-shop-subscription`,
        updated_at: now,
      })
      .eq('id', payload.partnership_id);
    if (result.error) throw new Error(result.error.message);
    return;
  }

  if (job.fulfillment_type === 'implementation_package') {
    const paidCents = Number(payload.amount_cents || 0);
    const packageTotal = Number(payload.package_total_cents || 0);
    const status = payload.payment_choice === 'full' ? 'paid_in_full' : 'deposit_paid';
    const result = await db
      .from('implementation_orders')
      .update({
        status,
        amount_paid_cents: paidCents,
        balance_due_cents: Math.max(0, packageTotal - paidCents),
        customer_name: payload.buyer_name,
        customer_email: payload.buyer_email,
        billing_provider: 'quickbooks',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.implementation_order_id)
      .in('status', ['pending', 'payment_failed']);
    if (result.error) throw new Error(result.error.message);
    return;
  }

  throw new Error(`Unsupported billing fulfillment type: ${job.fulfillment_type}`);
}
