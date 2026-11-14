import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { HostShopReadinessItem } from '@/lib/partners/host-shop-readiness';

export default function HostShopReadinessBanner({ items }: { items: HostShopReadinessItem[] }) {
  if (!items.length) {
    return <p className="mx-auto mt-3 flex max-w-7xl items-center gap-2 rounded-xl bg-green-50 px-4 py-2 font-bold text-green-950">
      <CheckCircle2 className="h-5 w-5" /> Host Shop onboarding complete
    </p>;
  }
  const required = items.filter((item) => item.severity === 'required').length;
  return (
    <details className="mx-auto mt-3 max-w-7xl rounded-xl border border-amber-300 bg-amber-50 px-4 text-amber-950">
      <summary className="min-h-11 cursor-pointer py-3 font-bold">
        <AlertTriangle className="mr-2 inline h-5 w-5" />
        Outstanding Host Shop requirements ({items.length}) · {required} for your shop
      </summary>
      <ul className="divide-y divide-amber-200">
        {items.map((item) => <li key={item.key} className="py-3">
          <p className="text-xs font-bold">{item.severity === 'review' ? 'Elevate review' : 'Shop action'}</p>
          <Link href={item.href} className="inline-flex min-h-11 items-center font-bold underline">{item.title}</Link>
          <p className="text-sm">{item.detail}</p>
        </li>)}
      </ul>
    </details>
  );
}
