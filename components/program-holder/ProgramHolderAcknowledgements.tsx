'use client';
import { useState } from 'react';
import { ENCHANTED_HEARTS, formatUsd } from '@/lib/partners/enchanted-hearts';

export function ProgramHolderAcknowledgements({
  requiresEnchantedHeartsTerms = false,
}: {
  requiresEnchantedHeartsTerms?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(formData: FormData) {
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/program-holder/acknowledgements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handbook: formData.get('handbook') === 'yes',
        rights: formData.get('rights') === 'yes',
        non_compete: formData.get('non_compete') === 'yes',
        enchanted_hearts_referral_terms: formData.get('enchanted_hearts_referral_terms') === 'yes',
      }),
    });
    const result = await response.json();
    setBusy(false);
    setMessage(
      response.ok
        ? 'Acknowledgements recorded.'
        : result.error || 'Unable to save acknowledgements.',
    );
    if (response.ok) window.setTimeout(() => window.location.reload(), 500);
  }
  return (
    <form action={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Required onboarding acknowledgements</h2>
      <p className="mt-1 text-sm text-slate-600">
        Review the Program Holder handbook, rights and responsibilities, and non-compete terms
        before accepting.
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-blue-700">
        <a href="/program-holder/handbook" target="_blank" rel="noreferrer">
          Read Program Holder Handbook
        </a>
        <a href="/program-holder/rights-responsibilities" target="_blank" rel="noreferrer">
          Read Rights and Responsibilities
        </a>
        <a href="/program-holder/non-compete" target="_blank" rel="noreferrer">
          Read Non-Compete Terms
        </a>
        <a
          href="https://www.elevateforhumanity.org/legal/program-host-agreement"
          target="_blank"
          rel="noreferrer"
        >
          Read Full Program Holder Agreement
        </a>
      </div>
      <div className="mt-4 space-y-3">
        <label className="flex items-start gap-3 rounded-xl border p-4 text-sm font-semibold">
          <input name="handbook" value="yes" type="checkbox" required className="mt-1" /> I reviewed
          and accept the Program Holder handbook.
        </label>
        <label className="flex items-start gap-3 rounded-xl border p-4 text-sm font-semibold">
          <input name="rights" value="yes" type="checkbox" required className="mt-1" /> I reviewed
          and accept the rights and responsibilities.
        </label>
        <label className="flex items-start gap-3 rounded-xl border p-4 text-sm font-semibold">
          <input name="non_compete" value="yes" type="checkbox" required className="mt-1" /> I
          reviewed and agree to the Program Holder non-compete and non-solicitation terms.
        </label>
        {requiresEnchantedHeartsTerms ? (
          <div className="rounded-xl border-2 border-fuchsia-200 bg-fuchsia-50 p-4 text-sm text-slate-800">
            <h3 className="font-black text-slate-950">
              Enchanted Hearts referral, pricing, and payment terms
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-6">
              <li>All Elevate-referred students must be contacted and served through Elevate.</li>
              <li>
                Do not solicit, divert, enroll, invoice, or accept payment from an Elevate-referred
                student outside Elevate's authorized workflow.
              </li>
              <li>
                Student contact details may be used only for authorized follow-up in this portal;
                they may not be exported, reused, or shared.
              </li>
              <li>
                Elevate collects the student-facing price. The provider receives the listed share,
                and Elevate retains the difference for administration and coordination. The margin
                varies by offering and is not a flat markup.
              </li>
              <li>
                Provider payments require cleared student funds, approved onboarding documents, a
                verified payout destination, completed service milestones, and adjustment for
                refunds or chargebacks.
              </li>
            </ul>
            <div className="mt-4 overflow-x-auto rounded-lg border border-fuchsia-200 bg-white">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-fuchsia-100 text-slate-950">
                  <tr>
                    <th className="p-2">Program</th>
                    <th className="p-2">Provider share</th>
                    <th className="p-2">Elevate price</th>
                  </tr>
                </thead>
                <tbody>
                  {ENCHANTED_HEARTS.programs.map((program) => (
                    <tr key={program.slug} className="border-t border-fuchsia-100">
                      <td className="p-2 font-semibold">{program.title}</td>
                      <td className="p-2">{formatUsd(program.providerShareCents)}</td>
                      <td className="p-2 font-black">{formatUsd(program.retailPriceCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className="mt-4 flex items-start gap-3 rounded-lg border border-fuchsia-300 bg-white p-3 font-semibold">
              <input
                name="enchanted_hearts_referral_terms"
                value="yes"
                type="checkbox"
                required
                className="mt-1"
              />
              I accept the Enchanted Hearts referral, student-contact, pricing, checkout, and
              provider-payment terms above.
            </label>
          </div>
        ) : null}
      </div>
      <button
        disabled={busy}
        className="mt-4 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Record acknowledgements'}
      </button>
      {message && (
        <p role="status" className="mt-3 text-sm font-bold">
          {message}
        </p>
      )}
    </form>
  );
}
