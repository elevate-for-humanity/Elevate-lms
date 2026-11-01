import 'server-only';

/** Only explicit workspace billing authorities receive organization invoices. Profile pointers alone never grant billing control. */
export async function storeBillingKeys(db: any, userId: string): Promise<string[]> {
  const [legacy, current] = await Promise.all([
    db
      .from('tenant_memberships')
      .select('tenant_id')
      .eq('user_id', userId)
      .in('role', ['owner', 'admin']),
    db
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('tenant_role', ['owner', 'admin']),
  ]);
  if (legacy.error || current.error)
    throw new Error('Store billing ownership could not be verified.');
  const tenantIds = [
    ...new Set(
      [...(legacy.data || []), ...(current.data || [])]
        .map((row: any) => row.tenant_id)
        .filter(Boolean),
    ),
  ];
  const keys = [`user:${userId}`];
  if (tenantIds.length) {
    const orgs = await db.from('organizations').select('id').in('tenant_id', tenantIds);
    if (orgs.error) throw new Error('Store billing workspace could not be verified.');
    keys.push(...(orgs.data || []).map((row: any) => `organization:${row.id}`));
  }
  return keys;
}

export function quickBooksPaymentHref(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      (url.hostname === 'intuit.com' || url.hostname.endsWith('.intuit.com'))
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export async function loadStoreBilling(db: any, userId: string) {
  const keys = await storeBillingKeys(db, userId);
  const types = [
    'platform_subscription',
    'individual_app_subscription',
    'store_order',
    'implementation_package',
    'website_domain_purchase',
  ];
  const [invoices, schedules, apps] = await Promise.all([
    db
      .from('billing_invoices')
      .select(
        'id,invoice_number,total_cents,currency,status,due_at,paid_at,payment_url,fulfillment_type,created_at',
      )
      .in('customer_external_key', keys)
      .in('fulfillment_type', types)
      .eq('provider', 'quickbooks')
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('billing_schedules')
      .select(
        'id,product_name,amount_cents,cadence,next_invoice_date,status,collection_mode,fulfillment_type',
      )
      .in('customer_external_key', keys)
      .in('fulfillment_type', ['platform_subscription', 'individual_app_subscription'])
      .eq('provider', 'quickbooks')
      .order('created_at', { ascending: false }),
    db
      .from('user_app_subscriptions')
      .select('app_slug,plan,status,current_period_end,trial_ends_at')
      .eq('user_id', userId),
  ]);
  if (invoices.error || schedules.error || apps.error)
    throw new Error('Store billing is temporarily unavailable.');
  return {
    invoices: (invoices.data || []).map((row: any) => ({
      ...row,
      payment_url: quickBooksPaymentHref(row.payment_url),
    })),
    schedules: schedules.data || [],
    apps: apps.data || [],
  };
}
