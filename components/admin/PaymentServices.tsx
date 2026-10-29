import Link from 'next/link';
export function PaymentServices() {
  return <section className="space-y-4 rounded-2xl border bg-white p-5">
    <h2 className="text-xl font-black">Banking and payment services</h2>
    <p className="text-sm text-slate-600">Open your services here. These links do not verify an account connection or authorize a payment.</p>
    <div className="grid gap-4 md:grid-cols-3">
      <article className="space-y-3 rounded-xl border p-4"><h3 className="font-black">Bluevine</h3><p className="text-sm">Manage bank payments and connect Bluevine to QuickBooks under External Accounts → Integrations. Confirm the withdrawal account before paying.</p>
        <a href="https://app.bluevine.com" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">Open Bluevine</a><br />
        <Link href="/integrations/quickbooks" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">QuickBooks connection and account mapping</Link>
      </article>
      <article className="space-y-3 rounded-xl border p-4"><h3 className="font-black">Venmo</h3><p className="text-sm">Venmo payouts are available through an eligible PayPal Payouts account for US recipients. Venmo routing is not yet enabled in this dashboard.</p>
        <a href="https://developer.paypal.com/payouts/overview/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">Review Venmo payout setup</a>
      </article>
      <article className="space-y-3 rounded-xl border p-4"><h3 className="font-black">Square</h3><p className="text-sm">Manage customer payments, invoices and deposits. Square’s Payouts API reports deposits to your bank; it does not send contractor payments from this dashboard. Account sync is not connected here.</p>
        <a href="https://squareup.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">Open Square</a>
      </article>
    </div>
    <div className="flex flex-wrap gap-4"><Link href="/program-holder-invoices" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">Review partner invoices</Link><Link href="/payout-queue" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">Review &amp; Pay</Link></div>
  </section>;
}
