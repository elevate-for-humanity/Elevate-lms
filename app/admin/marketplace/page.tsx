import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ShoppingBag, Users, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
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
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Marketplace' }]} />
        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">Marketplace</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
            >
              <s.icon className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h2 className="font-semibold text-gray-900">{s.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{s.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
