import Link from 'next/link';
import LogoImage from '@/components/site/LogoImage';
import { storeSignInHref } from '@/lib/store/sign-in-return.mjs';

export default function StoreHeader() {
  return (
    <header className="relative z-[100] border-b border-slate-200 bg-white" data-site-header data-header-owner="store-root">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          <Link href="/store" className="inline-flex min-w-0 items-center gap-2" aria-label="Elevate Store home">
            <LogoImage alt="Elevate" width={32} height={40} sizes="32px" className="h-10 w-8 shrink-0 object-contain" />
            <span className="whitespace-nowrap text-sm font-extrabold text-slate-950">Elevate Store</span>
          </Link>
          <Link href={storeSignInHref('/store')} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Sign In
          </Link>
        </div>
        <nav aria-label="Store navigation" className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-800 sm:mt-0">
          <Link href="/store" className="inline-flex min-h-11 items-center whitespace-nowrap hover:underline">Catalog</Link>
          <Link href="/store/apps" className="inline-flex min-h-11 items-center whitespace-nowrap hover:underline">Apps</Link>
          <Link href="/store/plans" className="inline-flex min-h-11 items-center whitespace-nowrap hover:underline">Plans</Link>
          <Link href="/store/cart" className="inline-flex min-h-11 items-center whitespace-nowrap hover:underline">Cart</Link>
        </nav>
      </div>
    </header>
  );
}
