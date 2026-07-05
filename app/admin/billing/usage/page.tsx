export default function AdminBillingUsagePage() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-900">
      <p className="font-semibold mb-2">Usage metering (Phase 2)</p>
      <p>
        SMS overage, storage per 100 GB, and seat overages will appear here. Stripe metered billing
        hooks will attach to <code className="font-mono">addon_subscriptions</code>.
      </p>
    </div>
  );
}
