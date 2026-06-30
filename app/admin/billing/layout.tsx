import { requireRole } from '@/lib/auth/require-role';
import { BillingSubnav, ADMIN_BILLING_NAV } from '@/components/billing/BillingSubnav';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default async function AdminBillingLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['admin', 'super_admin', 'staff']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Billing' }]} />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">SaaS billing</h1>
        <p className="text-slate-600 text-sm mb-6">
          Plans, add-ons, and organization subscriptions (Phase 1 licensing layer).
        </p>
        <BillingSubnav items={ADMIN_BILLING_NAV} basePath="/admin/billing" />
        {children}
      </div>
    </div>
  );
}
