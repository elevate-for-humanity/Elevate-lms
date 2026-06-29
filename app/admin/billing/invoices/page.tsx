export default function AdminBillingInvoicesPage() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
      <p className="font-semibold text-slate-900 mb-2">Invoices</p>
      <p>
        Stripe Customer Portal and synced invoice rows will be linked here in Phase 2. Customers
        can open the portal from{' '}
        <code className="font-mono text-xs">/account/payment-methods</code>.
      </p>
    </div>
  );
}
