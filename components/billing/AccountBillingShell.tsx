import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BillingSubnav, ACCOUNT_BILLING_NAV } from '@/components/billing/BillingSubnav';

export function AccountBillingShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: title }]} />
        <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-2">{title}</h1>
        <BillingSubnav items={ACCOUNT_BILLING_NAV} basePath="/account" />
        {children}
      </div>
    </div>
  );
}

export function UpgradeCta() {
  return (
    <Link
      href="/store/plans"
      className="inline-flex mt-4 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700"
    >
      View plans & add-ons
    </Link>
  );
}
