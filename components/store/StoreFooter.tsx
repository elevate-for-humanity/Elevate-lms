import Link from 'next/link';
import { LEGAL_ENTITY_OPERATING_LINE } from '@/lib/config/legal-entity';

export default function StoreFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
        <p className="font-bold">Elevate Store</p>
        <nav aria-label="Store policies" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/store/proof" className="inline-flex min-h-11 items-center hover:underline">Offers and limits</Link>
          <Link href="/privacy" className="inline-flex min-h-11 items-center hover:underline">Privacy</Link>
          <Link href="/terms-of-service" className="inline-flex min-h-11 items-center hover:underline">Terms of Service</Link>
          <Link href="/security-and-data-protection" className="inline-flex min-h-11 items-center hover:underline">Security and Data</Link>
        </nav>
        <p className="max-w-4xl text-sm leading-6">{LEGAL_ENTITY_OPERATING_LINE}</p>
        <p className="text-sm">© {new Date().getFullYear()} Elevate for Humanity. All rights reserved.</p>
      </div>
    </footer>
  );
}
