import Link from 'next/link';
import { CreditCard, ShieldCheck, WalletCards } from 'lucide-react';

/** Payment collection is managed by Elevate billing, not by a website-owned merchant account. */
export function BusinessCardsPanel({ websiteId: _websiteId }: { websiteId: string }) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2 text-slate-900">
                <WalletCards className="h-5 w-5" />
                <h2 className="text-lg font-black">Payments & business cards</h2>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Elevate manages approved invoices and payment agreements through its billing system,
                QuickBooks, and PayPal. A website does not create a separate merchant account here.
              </p>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4" /> Managed billing
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-black text-slate-900">Invoices and payment agreements</p>
              <p className="mt-1 text-sm text-slate-600">Use the approved offer and billing flow before granting access or marking an invoice paid.</p>
              <Link href="https://app.elevateforhumanity.org/account/payment-methods" className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">View billing</Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <CreditCard className="mb-2 h-5 w-5 text-slate-700" />
              <p className="font-black text-slate-900">Virtual cards</p>
              <p className="mt-1 text-sm text-slate-600">Commercial expense cards are unavailable.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <CreditCard className="mb-2 h-5 w-5 text-slate-700" />
              <p className="font-black text-slate-900">Physical cards</p>
              <p className="mt-1 text-sm text-slate-600">Commercial expense cards are unavailable.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
