import Link from 'next/link';

// Tuition refund policy, worded exactly as Section 7 of the enrollment
// agreement (apps/marketing/app/legal/enrollment-agreement/page.tsx).
// The dashboard notice must not restate the policy more strictly than the
// agreement students signed: a full refund is available before program
// start and 75% within the first week. The no-refund rule applies after
// week one, which is the operative rule for enrolled students.
export const TUITION_REFUND_RULES = [
  {
    label: 'Before program start',
    text: 'Full refund of tuition paid, minus a $50 administrative fee',
  },
  {
    label: 'Within the first week',
    text: '75% refund of tuition',
  },
  {
    label: 'After week one',
    text: 'No refund. Students who withdraw after week one remain responsible for the full tuition balance',
  },
] as const;

export default function TuitionRefundPolicyNotice() {
  return (
    <section
      aria-label="Tuition refund policy"
      className="rounded-3xl border border-amber-300 bg-amber-50 p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-xl font-semibold text-slate-950">Tuition refund policy</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
        After week one: No refund. Students who withdraw after week one remain responsible for the
        full tuition balance.
      </p>
      <ul className="mt-4 space-y-2 text-sm font-medium leading-6 text-slate-800">
        {TUITION_REFUND_RULES.map((rule) => (
          <li key={rule.label}>
            <strong>{rule.label}:</strong> {rule.text}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm font-medium leading-6 text-slate-700">
        Funding agency refund requirements supersede this policy where applicable.
      </p>
      <p className="mt-3 text-sm font-bold">
        <Link href="/refund-policy" className="underline hover:text-brand-red-700">
          Read the full refund policy
        </Link>
      </p>
    </section>
  );
}
