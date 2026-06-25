import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ShoppingBag, Users, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Marketplace | Admin | Elevate For Humanity',
};

const sections = [
  {
    name: 'Products',
    href: '/admin/marketplace/products',
    icon: ShoppingBag,
    description: 'Review and approve marketplace product listings.',
  },
  {
    name: 'Creators',
    href: '/admin/marketplace/creators',
    icon: Users,
    description: 'Manage creator accounts and approval status.',
  },
  {
    name: 'Payouts',
    href: '/admin/marketplace/payouts',
    icon: DollarSign,
    description: 'Track and process creator payout requests.',
  },
];

export default async function AdminMarketplacePage() {
  await requireRole(['admin', 'staff']);
  const db = await createClient();

  const [{ count: productCount }, { count: creatorCount }, { count: pendingPayouts }] =
    await Promise.all([
      db.from('marketplace_products').select('*', { count: 'exact', head: true }),
      db.from('marketplace_creators').select('*', { count: 'exact', head: true }),
      db.from('marketplace_creators').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

  const sections = [
    {
      name: 'Products',
      href: '/admin/marketplace/products',
      icon: ShoppingBag,
      description: 'Review and approve marketplace product listings.',
      count: productCount ?? 0,
      label: 'products',
    },
    {
      name: 'Creators',
      href: '/admin/marketplace/creators',
      icon: Users,
      description: 'Manage creator accounts and approval status.',
      count: creatorCount ?? 0,
      label: 'creators',
    },
    {
      name: 'Payouts',
      href: '/admin/marketplace/payouts',
      icon: DollarSign,
      description: 'Track and process creator payout requests.',
      count: pendingPayouts ?? 0,
      label: 'pending',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Marketplace' }]} />
        <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-6">Marketplace</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
            >
              <s.icon className="w-8 h-8 text-brand-blue-600 mb-3" />
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold text-slate-900">{s.name}</h2>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{s.count}</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              <p className="text-sm text-slate-700 mt-2">{s.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
