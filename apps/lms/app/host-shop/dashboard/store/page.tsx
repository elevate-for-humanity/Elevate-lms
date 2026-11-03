import Link from 'next/link';
import { ExternalLink, ShoppingBag } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Store | Host Shop Portal',
  description: 'Verified purchasing options for host shops.',
  robots: { index: false, follow: false },
};

export default async function HostShopStorePage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">
            {board.partner?.name || 'Host Shop'}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Host Shop Store</h1>
          <p className="mt-2 text-slate-600">Find supplies and services for your shop.</p>
        </div>
        <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
          Back to dashboard
        </Link>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue-700">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-slate-950">Shop supplies and services</h2>
        <p className="mt-3 text-slate-700">Browse the Elevate store or contact us about a service for your shop.</p>

        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="https://www.elevateforhumanity.org/store"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-800"
          >
            Open Elevate Store <ExternalLink className="h-4 w-4" />
          </a>
          <Link href="https://www.elevateforhumanity.org/contact" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">
            Request a host-shop service
          </Link>
        </div>
      </section>
    </main>
  );
}
