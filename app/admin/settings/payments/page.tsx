import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import SettingsFormClient, { SettingsField } from '@/components/admin/settings/SettingsFormClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = { title: 'Payments | Admin Settings' };

const KEYS = ['stripe_mode', 'currency', 'payment_methods'];

const FIELDS: SettingsField[] = [
  {
    key: 'stripe_mode',
    label: 'Stripe Mode',
    description: 'Live or test mode for payment processing',
    type: 'select',
    options: [
      { value: 'test', label: 'Test' },
      { value: 'live', label: 'Live' },
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
      { value: 'card',                  label: 'Card only' },
      { value: 'stripe',                label: 'Stripe only' },
      { value: 'card,affirm',           label: 'Card + Affirm (BNPL)' },
      { value: 'card,sezzle',           label: 'Card + Sezzle (BNPL)' },
      { value: 'card,affirm,sezzle',    label: 'Card + Affirm + Sezzle' },
      { value: 'stripe,affirm',         label: 'Stripe + Affirm (BNPL)' },
      { value: 'stripe,sezzle',         label: 'Stripe + Sezzle (BNPL)' },
      { value: 'stripe,affirm,sezzle',  label: 'Stripe + Affirm + Sezzle' },
    ],
  },
];

export default async function PaymentSettingsPage() {
  const auth = await requireRole(['admin', 'super_admin']);
  const isSuperAdmin = auth.effectiveRoles.includes('super_admin');
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', KEYS);

  const initialValues: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );
  if (!initialValues['stripe_mode'])     initialValues['stripe_mode']     = 'test';
  if (!initialValues['currency'])        initialValues['currency']        = 'USD';
  if (!initialValues['payment_methods']) initialValues['payment_methods'] = 'card,affirm,sezzle';

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / Payments
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Settings</h1>
        <p className="text-slate-500">Stripe configuration, payment methods, and currency.</p>
      </div>

      <SettingsFormClient
        fields={FIELDS}
        initialValues={initialValues}
        superAdminOnly
        isSuperAdmin={isSuperAdmin}
      />

      <p className="text-xs text-slate-400 max-w-xl">
        Stripe API keys are managed in{' '}
        <Link href="/admin/settings/integrations" className="text-brand-blue-600 underline">
          Dev Studio → Secrets
        </Link>. Webhook endpoints and price IDs live in the{' '}
        <Link href="/admin/integrations/env-manager" className="text-brand-blue-600 underline">
          Env Manager
        </Link>.
      </p>
    </div>
  );
}
