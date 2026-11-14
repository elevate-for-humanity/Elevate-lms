'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { TaxSecurityVerification } from '../../_components/TaxSecurityVerification';
import counties from '@/lib/payroll/indiana-counties-2026.json';
import type {
  PayrollEmployee,
  PayrollDraft,
  calculatePayrollDraft,
} from '@/lib/payroll/supersonic-2026';
type Company = {
  id: string;
  office_id: string;
  legal_name: string;
  frequency: PayrollEmployee['frequency'];
  version: number;
  employees: PayrollEmployee[];
};
type Run = {
  id: string;
  status: string;
  version: number;
  input: PayrollDraft;
  calculation: ReturnType<typeof calculatePayrollDraft>;
};
const endpoint = '/api/tax/office/payroll';
const field =
  'mt-2 block min-h-12 w-full rounded-lg border border-slate-400 bg-white p-3 text-base text-slate-950';
const button =
  'inline-flex min-h-12 items-center justify-center rounded-xl bg-[#073ca2] px-5 py-3 font-bold text-white disabled:opacity-50';
const money = (c: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c / 100);
const blankEmployee = (frequency: Company['frequency']): PayrollEmployee => ({
  id: crypto.randomUUID(),
  name: '',
  reference: '',
  active: true,
  hourlyRateCents: 0,
  frequency,
  w4: {
    year: 2026,
    filingStatus: 'single',
    multipleJobs: false,
    exempt: false,
    annualCreditsCents: 0,
    otherIncomeCents: 0,
    deductionsCents: 0,
    extraWithholdingCents: 0,
  },
  indiana: {
    resident: true,
    countyCode: '',
    personalExemptions: 0,
    dependentExemptions: 0,
    firstTimeDependentExemptions: 0,
    adoptedChildExemptions: 0,
    extraStateCents: 0,
    extraCountyCents: 0,
  },
});
export function PayrollWorkspace() {
  const [companies, setCompanies] = useState<Company[]>([]),
    [offices, setOffices] = useState<{ id: string; office_name: string }[]>([]),
    [selected, setSelected] = useState(''),
    [company, setCompany] = useState<Company | null>(null),
    [runs, setRuns] = useState<Run[]>([]),
    [employee, setEmployee] = useState<PayrollEmployee | null>(null),
    [active, setActive] = useState<Run | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const [input, setInput] = useState<PayrollDraft>({
    periodStart: '',
    periodEnd: '',
    payDate: '',
    timesheetsReviewed: true,
    lines: [],
  });
  useEffect(() => {
    const abort = new AbortController();
    setError('');
    setCompany(null);
    setActive(null);
    setEmployee(null);
    void (async () => {
      const r = await fetch(
        endpoint + (selected ? '?companyId=' + encodeURIComponent(selected) : ''),
        { cache: 'no-store', signal: abort.signal },
      );
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      if (abort.signal.aborted) return;
      if (selected) {
        setCompany(b.company);
        setRuns(b.runs);
        setInput({
          periodStart: '',
          periodEnd: '',
          payDate: '',
          timesheetsReviewed: true,
          lines: [],
        });
      } else {
        setCompanies(b.companies);
        setOffices(b.offices);
      }
    })().catch((e) => {
      if (!abort.signal.aborted) setError(e.message || 'PAYROLL_UNAVAILABLE');
    });
    return () => abort.abort();
  }, [selected, revision]);
  async function post(body: unknown) {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const b = await r.json();
    if (!r.ok) throw Error(b.error || 'Payroll could not be saved');
    return b;
  }
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payroll could not be saved');
    } finally {
      setBusy(false);
    }
  }
  async function createCompany(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    await action(async () => {
      const b = await post({
        action: 'create_company',
        officeId: d.get('office'),
        name: d.get('name'),
        frequency: d.get('frequency'),
      });
      setSelected(b.companyId);
      setNotice('Company saved. Add employees using their signed withholding elections.');
    });
  }
  async function saveEmployee(e: FormEvent) {
    e.preventDefault();
    if (!company || !employee) return;
    await action(async () => {
      await post({
        action: 'save_employee',
        companyId: company.id,
        expectedVersion: company.version,
        employee,
      });
      setRevision((v) => v + 1);
      setNotice('Employee saved. Existing payroll approvals and review records are retained.');
    });
  }
  function line(id: string) {
    return (
      input.lines.find((l) => l.employeeId === id) ?? {
        employeeId: id,
        regularMinutes: 0,
        overtimeMinutes: 0,
        afterTaxDeductionCents: 0,
        priorSocialSecurityWagesCents: 0,
        priorMedicareWagesCents: 0,
        priorWageEvidence: '',
      }
    );
  }
  function updateLine(id: string, key: string, value: unknown) {
    setInput((v) => ({
      ...v,
      lines: [...v.lines.filter((l) => l.employeeId !== id), { ...line(id), [key]: value }],
    }));
  }
  async function saveRun(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!company) return;
    const d = new FormData(e.currentTarget);
    if (d.get('reviewed') !== 'on') {
      setError('Review the timesheets and prior wage evidence before saving.');
      return;
    }
    await action(async () => {
      const b = await post({
        action: 'save_run',
        companyId: company.id,
        expectedVersion: company.version,
        runId: active?.id ?? crypto.randomUUID(),
        expectedRunVersion: active?.version ?? null,
        input: {
          ...input,
          timesheetsReviewed: true,
          lines: input.lines.filter((l) => l.regularMinutes + l.overtimeMinutes > 0),
        },
      });
      setActive(b.run);
      setRuns((v) => [b.run, ...v.filter((r) => r.id !== b.run.id)]);
      setNotice('Payroll draft saved and calculated. No wages were sent and no taxes were filed.');
    });
  }
  async function review(decision: 'approve' | 'void') {
    if (!company || !active) return;
    await action(async () => {
      const b = await post({
        action: 'review_run',
        companyId: company.id,
        runId: active.id,
        expectedRunVersion: active.version,
        decision,
      });
      setActive(b.run);
      setRuns((v) => [b.run, ...v.filter((r) => r.id !== b.run.id)]);
      setNotice(
        decision === 'approve'
          ? 'Approved for review export. This does not send wages or file tax returns.'
          : 'Run voided. Its original calculation and audit history are retained.',
      );
    });
  }
  if (error === 'MFA_REQUIRED')
    return <TaxSecurityVerification onVerified={() => setRevision((v) => v + 1)} />;
  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-bold uppercase tracking-wide text-[#073ca2]">
          Supersonic Fast Cash
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Payroll workspace</h1>
        <p className="mt-4 max-w-3xl leading-7">
          Prepare regular Indiana payroll for October–December 2026. Keep each client company, its
          employees and payroll reviews separate.
        </p>
        <nav className="mt-4 flex flex-wrap gap-5 print:hidden">
          <Link
            href="/tax-software/office/services"
            className="min-h-12 py-3 font-bold text-sky-800 underline"
          >
            Tax & payroll services
          </Link>
          <Link
            href="/tax-software/office/preparation"
            className="min-h-12 py-3 font-bold text-sky-800 underline"
          >
            Tax preparation
          </Link>
          <button
            className="min-h-12 font-bold text-sky-800 underline"
            onClick={() => {
              setSelected('');
              setRevision((v) => v + 1);
            }}
          >
            Client companies
          </button>
        </nav>
      </header>
      <aside className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
        <h2 className="font-bold">Payment and filing connection required</h2>
        <p className="mt-2 leading-7">
          This workspace saves calculations and review approvals. Bank payroll processing, tax
          deposits, employer unemployment taxes, tax filings and Chime directory enrollment require
          separate verified provider connections. No bank account numbers or Social Security numbers
          are collected here.
        </p>
      </aside>
      {error && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-5">
          <p>
            {[
              'SIGN_IN_REQUIRED',
              'PAYROLL_OWNER_REQUIRED',
              'ACTIVE_OFFICE_REQUIRED',
              'VERIFIED_EMAIL_REQUIRED',
            ].includes(error)
              ? 'Sign in with a verified active office-owner account to manage payroll.'
              : error}
          </p>
          <Link
            href="/tax-software/login?redirect=%2Ftax-software%2Foffice%2Fpayroll"
            className="mt-3 inline-block font-bold underline"
          >
            Secure sign in
          </Link>
        </div>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          {notice}
        </p>
      )}
      {!selected && (
        <>
          <section>
            <h2 className="text-2xl font-bold">Client companies</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className="rounded-xl border border-slate-300 p-5 text-left hover:bg-blue-50"
                >
                  <strong>{c.legal_name}</strong>
                  <span className="mt-2 block">{c.frequency}</span>
                </button>
              ))}
            </div>
          </section>
          <form
            onSubmit={createCompany}
            className="grid gap-4 rounded-xl border p-6 sm:grid-cols-2"
          >
            <h2 className="text-2xl font-bold sm:col-span-2">Add a payroll client</h2>
            <label>
              Assigned office
              <select name="office" required className={field}>
                <option value="">Select your office</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.office_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Legal business name
              <input name="name" required maxLength={160} className={field} />
            </label>
            <label>
              Pay frequency
              <select name="frequency" className={field}>
                {['weekly', 'biweekly', 'semimonthly', 'monthly'].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <button disabled={busy || !offices.length} className={button}>
              Save company
            </button>
          </form>
        </>
      )}
      {selected && !company && !error && <p role="status">Loading the selected company…</p>}
      {company && (
        <>
          <section className="rounded-xl border p-5">
            <h2 className="text-2xl font-bold">{company.legal_name}</h2>
            <p className="mt-2">{company.frequency} payroll</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {company.employees.map((e) => (
                <button
                  key={e.id}
                  className="min-h-12 rounded-lg border px-4 py-2"
                  onClick={() => setEmployee(structuredClone(e))}
                >
                  {e.name}
                  {e.active ? '' : ' (inactive)'}
                </button>
              ))}
              <button
                className={button}
                onClick={() => setEmployee(blankEmployee(company.frequency))}
              >
                Add employee
              </button>
            </div>
          </section>
          {employee && (
            <form onSubmit={saveEmployee} className="space-y-5 rounded-xl border p-6 print:hidden">
              <h2 className="text-2xl font-bold">Employee withholding profile</h2>
              <p>
                Use the employee’s signed W-4 and WH-4. This calculator supports hourly, regular
                periodic Indiana-resident wages only.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  Employee name
                  <input
                    required
                    maxLength={120}
                    className={field}
                    value={employee.name}
                    onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                  />
                </label>
                <label>
                  Unique employee reference
                  <input
                    required
                    maxLength={80}
                    className={field}
                    value={employee.reference}
                    onChange={(e) => setEmployee({ ...employee, reference: e.target.value })}
                  />
                </label>
                <label>
                  Hourly rate ($)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={field}
                    value={employee.hourlyRateCents / 100}
                    onChange={(e) =>
                      setEmployee({
                        ...employee,
                        hourlyRateCents: Math.round(Number(e.target.value) * 100),
                      })
                    }
                  />
                </label>
                <label>
                  W-4 filing status
                  <select
                    className={field}
                    value={employee.w4.filingStatus}
                    onChange={(e) =>
                      setEmployee({
                        ...employee,
                        w4: {
                          ...employee.w4,
                          filingStatus: e.target.value as PayrollEmployee['w4']['filingStatus'],
                        },
                      })
                    }
                  >
                    <option value="single">Single or married filing separately</option>
                    <option value="married_joint">Married filing jointly</option>
                    <option value="head_of_household">Head of household</option>
                  </select>
                </label>
                <label>
                  W-4 year
                  <input
                    type="number"
                    min="2020"
                    max="2026"
                    required
                    className={field}
                    value={employee.w4.year}
                    onChange={(e) =>
                      setEmployee({
                        ...employee,
                        w4: { ...employee.w4, year: Number(e.target.value) },
                      })
                    }
                  />
                </label>
                <label>
                  Indiana county of residence on January 1
                  <select
                    required
                    className={field}
                    value={employee.indiana.countyCode}
                    onChange={(e) =>
                      setEmployee({
                        ...employee,
                        indiana: { ...employee.indiana, countyCode: e.target.value },
                      })
                    }
                  >
                    <option value="">Select county</option>
                    {Object.entries(counties).map(([code, c]) => (
                      <option key={code} value={code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-6">
                {(['multipleJobs', 'exempt'] as const).map((k) => (
                  <label key={k} className="flex min-h-12 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={employee.w4[k]}
                      onChange={(e) =>
                        setEmployee({ ...employee, w4: { ...employee.w4, [k]: e.target.checked } })
                      }
                    />
                    {k === 'multipleJobs'
                      ? 'W-4 Step 2 multiple jobs checked'
                      : 'Valid W-4 federal exemption claimed'}
                  </label>
                ))}
                <label className="flex min-h-12 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={employee.active}
                    onChange={(e) => setEmployee({ ...employee, active: e.target.checked })}
                  />
                  Active employee
                </label>
              </div>
              <details>
                <summary className="min-h-12 cursor-pointer py-3 font-bold">
                  W-4 amounts and Indiana exemptions
                </summary>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ['annualCreditsCents', 'W-4 Step 3 annual credits ($)'],
                      ['otherIncomeCents', 'Step 4(a) annual other income ($)'],
                      ['deductionsCents', 'Step 4(b) annual deductions ($)'],
                      ['extraWithholdingCents', 'Step 4(c) extra per paycheck ($)'],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k}>
                      {label}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={field}
                        value={employee.w4[k] / 100}
                        onChange={(e) =>
                          setEmployee({
                            ...employee,
                            w4: { ...employee.w4, [k]: Math.round(Number(e.target.value) * 100) },
                          })
                        }
                      />
                    </label>
                  ))}
                  {(
                    [
                      ['personalExemptions', 'WH-4 line 5 personal exemptions'],
                      ['dependentExemptions', 'Line 6 dependent exemptions'],
                      ['firstTimeDependentExemptions', 'Line 7 first-time dependent exemptions'],
                      ['adoptedChildExemptions', 'Line 8 adopted-child exemptions'],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k}>
                      {label}
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="1"
                        className={field}
                        value={employee.indiana[k]}
                        onChange={(e) =>
                          setEmployee({
                            ...employee,
                            indiana: { ...employee.indiana, [k]: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                  ))}
                  {(['extraStateCents', 'extraCountyCents'] as const).map((k) => (
                    <label key={k}>
                      Extra {k === 'extraStateCents' ? 'state' : 'county'} withholding per paycheck
                      ($)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={field}
                        value={employee.indiana[k] / 100}
                        onChange={(e) =>
                          setEmployee({
                            ...employee,
                            indiana: {
                              ...employee.indiana,
                              [k]: Math.round(Number(e.target.value) * 100),
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </details>
              <div className="flex flex-wrap gap-3">
                <button disabled={busy} className={button}>
                  Save employee
                </button>
                <button
                  type="button"
                  onClick={() => setEmployee(null)}
                  className="min-h-12 px-5 font-bold"
                >
                  Close
                </button>
              </div>
            </form>
          )}
          <section className="space-y-4 print:hidden">
            <h2 className="text-2xl font-bold">Saved payroll reviews</h2>
            <div className="flex flex-wrap gap-3">
              {runs.map((r) => (
                <button
                  key={r.id}
                  className="min-h-12 rounded-lg border px-4 py-2 text-left"
                  onClick={() => {
                    setActive(r);
                    setInput(structuredClone(r.input));
                  }}
                >
                  {r.calculation.payDate} · {r.status.replaceAll('_', ' ')} ·{' '}
                  {money(r.calculation.netCents)}
                </button>
              ))}
              <button
                className={button}
                onClick={() => {
                  setActive(null);
                  setInput({
                    periodStart: '',
                    periodEnd: '',
                    payDate: '',
                    timesheetsReviewed: true,
                    lines: [],
                  });
                }}
              >
                New payroll review
              </button>
            </div>
          </section>
          <form onSubmit={saveRun} className="space-y-5 rounded-xl border p-6 print:hidden">
            <h2 className="text-2xl font-bold">
              {active ? 'Reopened payroll review' : 'Prepare payroll'}
            </h2>
            <fieldset
              disabled={busy || Boolean(active && active.status !== 'draft')}
              className="space-y-5 disabled:opacity-70"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                {(['periodStart', 'periodEnd', 'payDate'] as const).map((k) => (
                  <label key={k}>
                    {
                      {
                        periodStart: 'Period starts',
                        periodEnd: 'Period ends',
                        payDate: 'Pay date',
                      }[k]
                    }
                    <input
                      required
                      type="date"
                      min="2026-10-01"
                      max="2026-12-31"
                      className={field}
                      value={input[k]}
                      onChange={(e) => setInput({ ...input, [k]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              {company.employees
                .filter((e) => e.active)
                .map((e) => (
                  <details key={e.id} className="rounded-lg border p-4" open={undefined}>
                    <summary className="min-h-12 cursor-pointer py-3 font-bold">
                      {e.name} · {money(e.hourlyRateCents)}/hour
                    </summary>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        Approved regular hours
                        <input
                          type="number"
                          min="0"
                          max="500"
                          step="0.25"
                          className={field}
                          value={line(e.id).regularMinutes / 60}
                          onChange={(v) =>
                            updateLine(
                              e.id,
                              'regularMinutes',
                              Math.round(Number(v.target.value) * 60),
                            )
                          }
                        />
                      </label>
                      <label>
                        Approved overtime hours (1.5×)
                        <input
                          type="number"
                          min="0"
                          max="500"
                          step="0.25"
                          className={field}
                          value={line(e.id).overtimeMinutes / 60}
                          onChange={(v) =>
                            updateLine(
                              e.id,
                              'overtimeMinutes',
                              Math.round(Number(v.target.value) * 60),
                            )
                          }
                        />
                      </label>
                      {(
                        [
                          [
                            'priorSocialSecurityWagesCents',
                            'Prior same-employer Social Security wages this year ($)',
                          ],
                          [
                            'priorMedicareWagesCents',
                            'Prior same-employer Medicare wages this year ($)',
                          ],
                          ['afterTaxDeductionCents', 'Authorized after-tax deduction ($)'],
                        ] as const
                      ).map(([k, label]) => (
                        <label key={k}>
                          {label}
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={field}
                            value={line(e.id)[k] / 100}
                            onChange={(v) =>
                              updateLine(e.id, k, Math.round(Number(v.target.value) * 100))
                            }
                          />
                        </label>
                      ))}
                      <label>
                        Prior wage report reference (or documented zero opening balance)
                        <input
                          maxLength={200}
                          className={field}
                          value={line(e.id).priorWageEvidence}
                          onChange={(v) => updateLine(e.id, 'priorWageEvidence', v.target.value)}
                        />
                      </label>
                    </div>
                  </details>
                ))}
              <p className="leading-7">
                Prior wages must come from actual same-employer payroll records. Earlier saved or
                approved drafts are not evidence of paid wages. Review overtime by workweek before
                entering hours. Pre-tax benefits, bonuses, tips, garnishments and multistate
                arrangements require a separate supported engine.
              </p>
              <label className="flex min-h-12 items-center gap-3">
                <input name="reviewed" type="checkbox" required />I reviewed the timesheets,
                withholding elections and prior wage records.
              </label>
              <button
                disabled={busy || !company.employees.some((e) => e.active)}
                className={button}
              >
                Save & calculate payroll draft
              </button>
            </fieldset>
          </form>
          {active && (
            <section className="space-y-5 rounded-xl border p-6">
              <h2 className="text-2xl font-bold">Payroll review · {active.calculation.payDate}</h2>
              <p>
                {active.status.replaceAll('_', ' ')} · Calculation {active.calculation.version}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['Gross wages', active.calculation.grossCents],
                  ['Employee taxes', active.calculation.employeeTaxCents],
                  ['Net wages', active.calculation.netCents],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-blue-50 p-4">
                    <p>{label}</p>
                    <strong className="mt-2 block text-2xl">{money(Number(value))}</strong>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <caption className="py-3 text-left">Employee withholding and wage review</caption>
                  <thead>
                    <tr>
                      {[
                        'Employee',
                        'Gross',
                        'Federal',
                        'State',
                        'County',
                        'Social Security',
                        'Medicare + additional',
                        'After-tax deduction',
                        'Net',
                      ].map((h) => (
                        <th key={h} className="whitespace-nowrap border-b p-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {active.calculation.lines.map((l) => (
                      <tr key={l.employeeId}>
                        {[
                          l.name,
                          money(l.grossCents),
                          money(l.federalCents),
                          money(l.stateCents),
                          money(l.countyCents),
                          money(l.socialSecurityCents),
                          money(l.medicareCents + l.additionalMedicareCents),
                          money(l.afterTaxDeductionCents),
                          money(l.netCents),
                        ].map((v, i) => (
                          <td key={i} className="whitespace-nowrap border-b p-3">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Employer Social Security and Medicare: {money(active.calculation.employerFicaCents)}
                . Employer unemployment taxes and other obligations are excluded. No funds sent. No
                tax returns filed.
              </p>
              <div className="flex flex-wrap gap-3 print:hidden">
                <a
                  className={button}
                  href={`${endpoint}?companyId=${company.id}&runId=${active.id}&download=csv`}
                >
                  Download payroll review CSV
                </a>
                <button className={button} onClick={() => window.print()}>
                  Print review
                </button>
                {active.status === 'draft' && (
                  <button disabled={busy} className={button} onClick={() => review('approve')}>
                    Approve for export only
                  </button>
                )}
                {active.status !== 'voided' && (
                  <button
                    disabled={busy}
                    className="min-h-12 rounded-lg border px-5 font-bold"
                    onClick={() => review('void')}
                  >
                    Void and retain history
                  </button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
