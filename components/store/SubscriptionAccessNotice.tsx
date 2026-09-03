export function SubscriptionAccessNotice({ reason }: { reason?: string | null }) {
  if (!reason) return null;

  const normalized = reason.toLowerCase();
  const trialExpired = normalized === 'trial-expired' || normalized === 'trial_expired';
  const pastDue = normalized === 'past_due' || normalized === 'past-due';
  const canceled = normalized === 'canceled' || normalized === 'inactive';
  const verification = normalized.includes('billing-verification');

  const title = trialExpired
    ? 'Your free trial has ended'
    : pastDue
      ? 'Your subscription needs payment attention'
      : canceled
        ? 'Your subscription is no longer active'
        : verification
          ? 'We could not verify your subscription'
          : 'A subscription is required to continue';

  const body = trialExpired
    ? 'Trial access is now stopped. Choose a paid plan below to continue using this app and keep access to the workspace you created during the trial.'
    : pastDue
      ? 'Access is paused while the subscription is past due. Select a plan or update billing to restore access.'
      : canceled
        ? 'Access is stopped for this app. Choose a paid plan below to reactivate it.'
        : verification
          ? 'Access is temporarily blocked because the billing status could not be verified. Review the plans below or billing details before continuing.'
          : 'Choose a paid plan below to continue using this app.';

  return (
    <section className="border-b border-amber-300 bg-amber-50 px-4 py-5" role="status" aria-live="polite">
      <div className="mx-auto max-w-6xl rounded-2xl border border-amber-300 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Subscription required</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 max-w-3xl leading-7 text-slate-700">{body}</p>
        <a href="#plans" className="mt-4 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800">
          View subscription plans
        </a>
      </div>
    </section>
  );
}
