import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Host Shop Application | Elevate', robots: { index: false, follow: false } };

// Old payment callbacks cannot establish whether an application fee was paid.
// Current applications are submitted directly by /api/host-shop/apply and
// confirmed by email with an application reference.
export default function HostShopApplicationSuccess() {
  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Check your Host Shop application</h1>
        <p className="mt-3 text-slate-600">
          This older payment return link no longer confirms an application or payment. A completed
          application has an email receipt with its reference number. If you paid through an older
          checkout, contact our team so the transaction can be reconciled before any status changes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/host-shop/apply" className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Host Shop application</Link>
          <Link href="/contact" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700">Contact Support</Link>
        </div>
      </div>
    </main>
  );
}
