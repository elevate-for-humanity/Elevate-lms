import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import SettingsFormClient, { SettingsField } from '@/components/admin/settings/SettingsFormClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Payments | Admin Settings' };

const KEYS = ['billing_provider', 'stripe_billing_mode', 'currency', 'payment_methods'];

const FIELDS: SettingsField[] = [
  {
    key: 'billing_provider',
    label: 'Primary Billing Provider',
    description: 'New invoices and payment requests are created with this provider.',
    type: 'select',
        options: [
      { value: 'quickbooks', label: 'QuickBooks — invoices and Pay Now links' },
    ],
  },
  {
    key: 'stripe_billing_mode',
    label: 'Legacy Payment History',
    description: 'Prior transactions remain read-only for accounting, refunds, disputes, and audit history.',
    type: 'select',
    options: [
      { value: 'archive', label: 'Archive only — no new charges' },
    ],
  },
  {
    key: 'currency',
    label: 'Currency',
    description: 'Default currency for transactions',
    type: 'select',
    options: [
      { value: 'USD', label: 'USD — US Dollar' },
      { value: 'CAD', label: 'CAD — Canadian Dollar' },
      { value: 'EUR', label: 'EUR — Euro' },
      { value: 'GBP', label: 'GBP — British Pound' },
    ],
  },
  {
    key: 'payment_methods',
    label: 'Payment Methods',
    description: 'Enabled payment providers',
    type: 'select',
    options: [
      { value: 'quickbooks_invoice,paypal', label: 'QuickBooks invoice + PayPal payouts' },
      { value: 'quickbooks_invoice,paypal,manual', label: 'QuickBooks invoice + PayPal payouts + manual payment' },
    ],
  },
];

export default async function PaymentSettingsPage() {
  const auth = await requireRole(['admin']);
  const isSuperAdmin = auth.effectiveRoles.includes('admin');
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', KEYS);

  const initialValues: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );
  if (!initialValues['billing_provider']) initialValues['billing_provider'] = 'quickbooks';
  if (!initialValues['stripe_billing_mode']) initialValues['stripe_billing_mode'] = 'archive';
  if (!initialValues['currency'])        initialValues['currency']        = 'USD';
  if (!initialValues['payment_methods']) initialValues['payment_methods'] = 'quickbooks_invoice,paypal';

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/settings" className="hover:text-slate-700">Settings</Link> / Payments
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Settings</h1>
        <p className="text-slate-500">QuickBooks invoicing, PayPal payouts, payment methods, and currency.</p>
      </div>

      <SettingsFormClient
        fields={FIELDS}
        initialValues={initialValues}
        superAdminOnly
        isSuperAdmin={isSuperAdmin}
      />

      <p className="text-xs text-slate-400 max-w-xl">
        QuickBooks creates new invoices and Pay Now requests. PayPal sends approved program-holder and contractor payouts. Prior payment-provider records remain read-only for reconciliation. Integration secrets are managed in{' '}
        <Link href="/settings/integrations" className="text-brand-blue-600 underline">
          Dev Studio → Secrets
        </Link>. Connection settings live in the{' '}
        <Link href="/integrations/env-manager" className="text-brand-blue-600 underline">
          Env Manager
        </Link>.
      </p>
    </div>
  );
}
