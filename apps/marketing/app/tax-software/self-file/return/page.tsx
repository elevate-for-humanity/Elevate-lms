'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TaxSiteShell } from '../../_components/TaxSiteShell';
import { deriveInterviewTriggers } from '@/lib/tax-software/paris-interview';
import { formsForTriggers } from '@/lib/tax-software/form-registry-2026';
import type { calculateFederal1040_2026 } from '@/lib/tax-software/calculation/federal-1040-2026';
import { FilingExportButton } from '../../_components/FilingExportButton';
import { TaxpayerDetailsEditor } from '../../_components/TaxpayerDetailsEditor';
import { FederalFormsEditor } from '../../_components/FederalFormsEditor';
import { BusinessSchedulesEditor } from '../../_components/BusinessSchedulesEditor';
import { TaxPaymentOptions } from '../../_components/TaxPaymentOptions';
import { quoteSelfFile } from '@/lib/tax-software/self-file-pricing';
const questions = [
  ['hasW2', 'Did you receive a W-2?'],
  ['hasSelfEmployment', 'Did you have business or self-employment income?'],
  ['hasInterest', 'Did you earn interest?'],
  ['hasDividends', 'Did you receive dividends?'],
  ['hasCapitalGains', 'Did you sell investments or other capital assets?'],
  ['hasRentalIncome', 'Did you have rental or pass-through income?'],
  ['itemizes', 'Do you plan to itemize deductions?'],
  ['hasDependentCare', 'Did you pay for dependent care?'],
  ['hasEducationExpenses', 'Did you pay education expenses?'],
  ['hasHsa', 'Did you have a health savings account?'],
] as const;
function Workspace() {
  const params = useSearchParams();
  const id = params.get('returnId');
  const [record, setRecord] = useState<any>(null);
  const [w2, setW2] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [estimate, setEstimate] = useState<ReturnType<typeof calculateFederal1040_2026> | null>(
    null,
  );
  useEffect(() => {
    let active = true;
    if (!id) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch('/api/tax/interview?returnId=' + encodeURIComponent(id), {
          cache: 'no-store',
        });
        const b = await res.json();
        if (!res.ok) throw Error(b.error || 'Unable to load return');
        if (active) {
          setRecord(b.taxReturn);
          setW2(b.w2);
          setAnswers(b.session?.answers ?? {});
          sessionStorage.setItem('sfc:active-return-id', id);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load return');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);
  async function save() {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/tax/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnId: id, answers }),
      });
      const b = await res.json();
      if (!res.ok) throw Error(b.error || 'Unable to save answers');
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save answers');
    } finally {
      setBusy(false);
    }
  }
  async function calculateEstimate() {
    setBusy(true);
    setError('');
    setEstimate(null);
    try {
      const savedResponse = await fetch('/api/tax/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnId: id, answers }),
      });
      const savedBody = await savedResponse.json();
      if (!savedResponse.ok) throw Error(savedBody.error || 'Unable to save current answers');
      setSaved(true);
      const response = await fetch('/api/tax/returns/calculate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnId: id }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || 'Unable to calculate estimate');
      setEstimate(body.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to calculate estimate');
    } finally {
      setBusy(false);
    }
  }
  const triggers = deriveInterviewTriggers({ ...answers, hasW2: answers.hasW2 || w2.length > 0 });
  const forms = formsForTriggers(triggers);
  const quote = quoteSelfFile(triggers);
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/tax-software/self-file" className="font-semibold text-sky-800">
          ← Your returns and documents
        </Link>
        <h1 className="mt-8 text-3xl font-bold sm:text-4xl">
          Supersonic Fast Cash return workspace
        </h1>
        {loading ? (
          <p className="mt-6">Loading return…</p>
        ) : !record ? (
          <p className="mt-6">Select an existing return from your workspace to continue.</p>
        ) : (
          <>
            <p className="mt-4 text-slate-600">
              {record.tax_year} · {record.filing_status.replaceAll('_', ' ')} ·{' '}
              {record.status.replaceAll('_', ' ')}
            </p>
            <nav
              aria-label="Return preparation steps"
              className="mt-5 flex flex-wrap gap-3 rounded-xl border bg-white p-4 text-sm font-semibold text-sky-800"
            >
              <a href="#income" className="inline-flex min-h-12 items-center px-2">
                1. Income
              </a>
              <a href="#federal-forms" className="inline-flex min-h-12 items-center px-2">
                2. Deductions & credits
              </a>
              <a href="#calculation" className="inline-flex min-h-12 items-center px-2">
                3. Calculate & review
              </a>
              <a href="#taxpayer-details" className="inline-flex min-h-12 items-center px-2">
                4. Taxpayer & signature
              </a>
              <a href="#filing-export" className="inline-flex min-h-12 items-center px-2">
                5. Export
              </a>
            </nav>
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <section className="rounded-2xl bg-white p-7">
                <h2 className="text-2xl font-bold">Income, deductions and credits interview</h2>
                <p className="mt-3 text-slate-600">
                  These answers organize the forms you may need. They do not establish eligibility
                  for a deduction or credit.
                </p>
                <div className="mt-6 space-y-5">
                  {questions.map(([key, label]) => (
                    <label key={key} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={answers[key] === true}
                        onChange={(e) => {
                          setAnswers((a) => ({ ...a, [key]: e.target.checked }));
                          setSaved(false);
                          setEstimate(null);
                        }}
                        className="mt-1 h-5 w-5"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => void save()}
                  disabled={busy}
                  className="mt-7 rounded-xl bg-sky-800 px-6 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Save interview answers'}
                </button>
                {saved && (
                  <p role="status" className="mt-3 font-semibold text-emerald-800">
                    Answers saved to your return.
                  </p>
                )}
                <h2 id="income" className="mt-10 scroll-mt-6 text-2xl font-bold">
                  Confirmed W-2 records
                </h2>
                <div className="mt-3 flex flex-wrap gap-4">
                  <Link
                    href={
                      '/tax-software/self-file/w2/confirm?manual=1&returnId=' +
                      encodeURIComponent(id!)
                    }
                    className="inline-flex min-h-12 items-center font-semibold text-sky-800 underline"
                  >
                    Add a W-2 manually
                  </Link>
                  <Link
                    href="/tax-software/self-file"
                    className="inline-flex min-h-12 items-center font-semibold text-sky-800 underline"
                  >
                    Upload a W-2 image
                  </Link>
                </div>
                {w2.length === 0 ? (
                  <p className="mt-3 text-slate-600">No confirmed W-2 records saved yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {w2.map((w) => (
                      <li key={w.id} className="rounded-lg border p-4">
                        <p className="font-semibold">{w.employer_name}</p>
                        <p>Wages: ${Number(w.wages).toFixed(2)}</p>
                        <p>Federal withholding: ${Number(w.federal_withholding ?? 0).toFixed(2)}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/tax-software/self-file"
                  className="mt-5 inline-flex font-semibold text-sky-800"
                >
                  Add or import a W-2 →
                </Link>
                <BusinessSchedulesEditor
                  returnId={id!}
                  joint={record.filing_status === 'married_joint'}
                  onSaved={() => {
                    setEstimate(null);
                    setAnswers((v) => ({ ...v, hasSelfEmployment: true }));
                  }}
                />
                <div id="federal-forms" className="scroll-mt-6">
                  <FederalFormsEditor
                    returnId={id!}
                    initialInputs={record.return_json?.federalInputs ?? {}}
                    onDirty={() => setEstimate(null)}
                    onSaved={(inputs) => {
                      setRecord((current: any) => ({
                        ...current,
                        return_json: { ...current.return_json, federalInputs: inputs },
                      }));
                      setEstimate(null);
                    }}
                  />
                </div>
                <div id="taxpayer-details" className="scroll-mt-6">
                  <TaxpayerDetailsEditor
                    returnId={id!}
                    joint={record.filing_status === 'married_joint'}
                    onSaved={() =>
                      setRecord((current: any) => ({
                        ...current,
                        return_json: { ...current.return_json, privateProfileComplete: true },
                      }))
                    }
                  />
                </div>
                <TaxPaymentOptions
                  returnId={id!}
                  calculationDigest={estimate ? JSON.stringify(estimate) : null}
                />
              </section>
              <aside className="space-y-5">
                <section className="rounded-2xl bg-white p-6">
                  <h2 id="calculation" className="scroll-mt-6 text-xl font-bold">
                    Federal return calculation
                  </h2>
                  <p className="mt-3 text-sm text-slate-600">
                    Calculates your saved federal income, deductions, credits, payments and
                    additional taxes. Complete and review every supporting form before filing.
                  </p>
                  <button
                    onClick={() => void calculateEstimate()}
                    disabled={busy}
                    className="mt-4 rounded-xl bg-sky-800 px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {busy ? 'Working…' : 'Calculate federal return'}
                  </button>
                  {estimate && (
                    <div role="status" className="mt-4 space-y-2 text-sm">
                      <dl className="space-y-2">
                        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                          <dt>
                            {estimate.amountOwed > 0
                              ? 'Estimated federal amount owed'
                              : 'Estimated federal refund'}
                          </dt>
                          <dd className="mt-2 text-2xl font-bold text-slate-950">
                            $
                            {(estimate.amountOwed > 0
                              ? estimate.amountOwed
                              : estimate.refundAmount
                            ).toFixed(2)}
                          </dd>
                        </div>
                        <div>
                          <dt>Federal income tax</dt>
                          <dd className="font-semibold">${estimate.incomeTax.toFixed(2)}</dd>
                        </div>
                        <div>
                          <dt>Total federal payments</dt>
                          <dd className="font-semibold">${estimate.totalPayments.toFixed(2)}</dd>
                        </div>
                      </dl>
                      <p className="pt-2 text-slate-600">
                        Calculation saved. Your return has not been submitted to the IRS.
                      </p>
                    </div>
                  )}
                </section>
                <section className="rounded-2xl bg-white p-6">
                  <h2 id="filing-export" className="scroll-mt-6 text-xl font-bold">
                    Filing export
                  </h2>
                  <p className="mt-3 text-sm text-slate-600">
                    Download the IRS XML after reviewing your calculation and saving taxpayer
                    details and signature. The download does not submit your return.
                  </p>
                  <FilingExportButton returnId={id!} />
                </section>
                <section className="rounded-2xl bg-white p-6">
                  <h2 className="text-xl font-bold">Forms identified</h2>
                  <ul className="mt-4 space-y-3">
                    {forms.map((f) => (
                      <li key={f.code}>
                        <span className="font-semibold">{f.code}</span>
                        <p className="text-sm text-slate-600">{f.name}</p>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="rounded-2xl bg-white p-6">
                  <h2 className="text-xl font-bold">Estimated software fee</h2>
                  <p className="mt-3 text-3xl font-bold">${quote.total.toFixed(2)}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Base federal preparation: free. No payment has been taken.
                  </p>
                  {quote.items.map((i) => (
                    <p key={i.code} className="mt-3 text-sm">
                      {i.label}: ${i.price.toFixed(2)}
                    </p>
                  ))}
                </section>
                <section className="rounded-2xl bg-amber-50 p-6">
                  <h2 className="font-bold">Filing status</h2>
                  <p className="mt-3">Not transmitted to the IRS.</p>
                  <p className="mt-2 text-sm">
                    Saved intake is available. Final tax forms, validation and certified electronic
                    transmission must be completed before filing.
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
export default function ReturnWorkspacePage() {
  return (
    <Suspense fallback={<p>Loading return…</p>}>
      <TaxSiteShell>
        <Workspace />
      </TaxSiteShell>
    </Suspense>
  );
}
