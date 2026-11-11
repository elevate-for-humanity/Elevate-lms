'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { TaxSecurityVerification } from '../../_components/TaxSecurityVerification';
import { FederalFormsEditor } from '../../_components/FederalFormsEditor';
import type { SavedFederalInputs } from '@/lib/tax-software/calculation/input-schema';
import type { calculateFederal1040_2026 } from '@/lib/tax-software/calculation/federal-1040-2026';
type W2 = {
  employerName: string;
  owner: 'primary' | 'spouse';
  wages: number;
  federalWithholding: number;
  socialSecurityWages?: number;
  medicareWages?: number;
  socialSecurityTax?: number;
  medicareTax?: number;
};
type Worksheet = { w2: W2[]; extra: SavedFederalInputs };
type Client = {
  id: string;
  office_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};
type Worklist = {
  offices: { id: string; office_name: string }[];
  clients: Client[];
  returns: {
    id: string;
    client_id: string;
    tax_year: number;
    status: string;
    filing_status: string;
  }[];
};
type ReturnDetail = {
  id: string;
  updated_at: string;
  tax_year: number;
  filing_status: string;
  status: string;
  worksheet: Worksheet;
  calculation: ReturnType<typeof calculateFederal1040_2026> | null;
};
const endpoint = '/api/tax/office/preparation';
const field =
  'mt-2 block min-h-12 w-full rounded-lg border border-slate-400 bg-white p-3 text-base text-slate-950';
const button =
  'inline-flex min-h-12 items-center justify-center rounded-xl bg-[#073ca2] px-5 py-3 font-bold text-white disabled:opacity-50';
const messages: Record<string, string> = {
  OFFICE_ACCESS_REQUIRED:
    'An approved office assignment is required. Your customer account does not grant professional access.',
  ACTIVE_OFFICE_REQUIRED:
    'This office is still in onboarding. Professional client preparation opens after the authorized office activation.',
  VERIFIED_EMAIL_REQUIRED: 'Verify your account email before accessing professional tax records.',
  RETURN_CHANGED_RELOAD: 'This return changed in another session. Reopen it before saving.',
  SPOUSE_REQUIRES_JOINT_RETURN: 'Spouse income requires a joint return.',
  INVALID_PREPARATION_REQUEST: 'Review the required fields and supported tax year.',
  CLIENT_NOT_FOUND: 'This client is not assigned to your office or account.',
  RETURN_NOT_FOUND: 'This return is not assigned to your office or account.',
};
export function ProfessionalWorkspace() {
  const [data, setData] = useState<Worklist | null>(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0),
    [active, setActive] = useState<ReturnDetail | null>(null),
    [client, setClient] = useState<Client | null>(null),
    [worksheet, setWorksheet] = useState<Worksheet>({ w2: [], extra: {} });
  useEffect(() => {
    let alive = true;
    void fetch(endpoint, { cache: 'no-store' })
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw Error(b.error);
        if (alive) {
          setData(b);
          setError('');
        }
      })
      .catch((e) => {
        if (alive) setError(e.message || 'PREPARATION_UNAVAILABLE');
      });
    return () => {
      alive = false;
    };
  }, [revision]);
  async function post(body: Record<string, unknown>) {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const b = await r.json();
    if (!r.ok)
      throw Error(
        messages[b.error] ?? 'The operation could not be completed. Reopen the return or retry.',
      );
    return b;
  }
  async function createClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      d = new FormData(form);
    setBusy(true);
    setMessage('');
    try {
      await post({
        action: 'create_client',
        officeId: d.get('officeId'),
        firstName: d.get('firstName'),
        lastName: d.get('lastName'),
        email: d.get('email'),
        phone: d.get('phone'),
      });
      form.reset();
      setRevision((v) => v + 1);
      setMessage('Client saved to your office. You can now start the client’s return.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save client.');
    } finally {
      setBusy(false);
    }
  }
  async function open(id: string) {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch(endpoint + '?returnId=' + encodeURIComponent(id), {
          cache: 'no-store',
        }),
        b = await r.json();
      if (!r.ok) throw Error(messages[b.error] ?? 'Unable to open return.');
      setActive(b.return);
      setClient(b.client);
      setWorksheet(b.return.worksheet);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to open return.');
    } finally {
      setBusy(false);
    }
  }
  async function start(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget),
      c = data?.clients.find((c) => c.id === d.get('clientId'));
    if (!c) return;
    setBusy(true);
    setMessage('');
    try {
      const b = await post({
        action: 'start_return',
        officeId: c.office_id,
        clientId: c.id,
        taxYear: 2026,
        filingStatus: d.get('filingStatus'),
      });
      await open(b.returnId);
      setRevision((v) => v + 1);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to start return.');
    } finally {
      setBusy(false);
    }
  }
  async function saveWorksheet(next: Worksheet, review: boolean) {
    if (!active) throw Error('Open a return first.');
    setBusy(true);
    setMessage('');
    try {
      const b = await post({
        action: 'save_return',
        returnId: active.id,
        expectedUpdatedAt: active.updated_at,
        worksheet: next,
        submitForReview: review,
      });
      setWorksheet(next);
      setActive((r) =>
        r ? { ...r, updated_at: b.updatedAt, calculation: b.calculation, status: b.status } : r,
      );
      setRevision((v) => v + 1);
      setMessage(
        review
          ? 'Return saved to the review queue. It has not been transmitted.'
          : 'Preparation saved and federal calculation updated.',
      );
      return next.extra;
    } finally {
      setBusy(false);
    }
  }
  if (error === 'MFA_REQUIRED')
    return <TaxSecurityVerification onVerified={() => setRevision((v) => v + 1)} />;
  if (error)
    return (
      <section className="rounded-xl border bg-white p-6">
        <h1 className="text-3xl font-bold">Secure professional access</h1>
        <p role="alert" className="mt-5 leading-7">
          {messages[error] ?? 'Sign in with your verified professional account to continue.'}
        </p>
        <Link
          href="/tax-software/login?redirect=%2Ftax-software%2Foffice%2Fpreparation"
          className={button + ' mt-5'}
        >
          Professional sign in
        </Link>
        <Link
          href="/tax-software/office"
          className="ml-4 inline-flex min-h-12 items-center font-semibold text-sky-800 underline"
        >
          Office onboarding & training
        </Link>
      </section>
    );
  if (!data) return <p role="status">Verifying your professional account and office access…</p>;
  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-bold uppercase tracking-wide text-[#073ca2]">
          Supersonic Fast Cash · Professional portal
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Client tax preparation</h1>
        <p className="mt-4 max-w-3xl leading-7">
          Manage your assigned clients and prepare their federal returns. Each preparer uses an
          individual verified account and two-step verification.
        </p>
        <nav className="mt-4 flex flex-wrap gap-4">
          <button
            className="min-h-12 font-bold text-sky-800 underline"
            onClick={() => {
              setActive(null);
              setClient(null);
            }}
          >
            Client directory & worklist
          </button>
          <Link
            href="/tax-software/office"
            className="inline-flex min-h-12 items-center font-bold text-sky-800 underline"
          >
            Office reports & staff training
          </Link>
        </nav>
      </header>
      {message && (
        <p role="status" className="rounded-xl border border-blue-200 bg-white p-5">
          {message}
        </p>
      )}
      {active ? (
        <section className="space-y-6">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="text-2xl font-bold">
              {client?.first_name} {client?.last_name} · {active.tax_year}
            </h2>
            <p className="mt-3">
              {active.filing_status.replaceAll('_', ' ')} · {active.status.replaceAll('_', ' ')}
            </p>
            <p className="mt-3 text-sm leading-6">
              Compare entered amounts with original client documents. These preparation worksheets
              do not transmit a return or replace taxpayer authorizations.
            </p>
          </div>
          <section className="rounded-xl border bg-white p-6">
            <h2 className="text-2xl font-bold">W-2 income</h2>
            {worksheet.w2.map((w, index) => (
              <fieldset key={index} className="mt-5 rounded-xl border p-5">
                <legend className="font-bold">W-2 {index + 1}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="font-semibold">
                    Employer name
                    <input
                      className={field}
                      value={w.employerName}
                      maxLength={120}
                      onChange={(e) => {
                        setWorksheet((v) => ({
                          ...v,
                          w2: v.w2.map((x, i) =>
                            i === index ? { ...x, employerName: e.target.value } : x,
                          ),
                        }));
                        setActive((v) => (v ? { ...v, calculation: null } : v));
                      }}
                    />
                  </label>
                  <label className="font-semibold">
                    Income owner
                    <select
                      className={field}
                      value={w.owner}
                      onChange={(e) => {
                        setWorksheet((v) => ({
                          ...v,
                          w2: v.w2.map((x, i) =>
                            i === index ? { ...x, owner: e.target.value as W2['owner'] } : x,
                          ),
                        }));
                        setActive((v) => (v ? { ...v, calculation: null } : v));
                      }}
                    >
                      <option value="primary">Taxpayer</option>
                      {active.filing_status === 'married_joint' && (
                        <option value="spouse">Spouse</option>
                      )}
                    </select>
                  </label>
                  {(
                    [
                      ['wages', 'Box 1 wages'],
                      ['federalWithholding', 'Box 2 federal withholding'],
                      ['socialSecurityWages', 'Box 3 Social Security wages'],
                      ['socialSecurityTax', 'Box 4 Social Security tax'],
                      ['medicareWages', 'Box 5 Medicare wages'],
                      ['medicareTax', 'Box 6 Medicare tax'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="font-semibold">
                      {label}
                      <input
                        className={field}
                        type="number"
                        min="0"
                        max="1000000000"
                        step="0.01"
                        value={w[key] ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : Number(e.target.value);
                          setWorksheet((v) => ({
                            ...v,
                            w2: v.w2.map((x, i) => (i === index ? { ...x, [key]: value } : x)),
                          }));
                          setActive((v) => (v ? { ...v, calculation: null } : v));
                        }}
                      />
                    </label>
                  ))}
                </div>
                <button
                  className="mt-3 min-h-12 font-semibold text-red-800 underline"
                  onClick={() => {
                    setWorksheet((v) => ({ ...v, w2: v.w2.filter((_, i) => i !== index) }));
                    setActive((v) => (v ? { ...v, calculation: null } : v));
                  }}
                >
                  Remove this worksheet W-2
                </button>
              </fieldset>
            ))}
            <button
              className={button + ' mt-5'}
              disabled={busy || worksheet.w2.length >= 30}
              onClick={() => {
                setWorksheet((v) => ({
                  ...v,
                  w2: [
                    ...v.w2,
                    { employerName: '', owner: 'primary', wages: 0, federalWithholding: 0 },
                  ],
                }));
                setActive((v) => (v ? { ...v, calculation: null } : v));
              }}
            >
              Add W-2 worksheet
            </button>
          </section>
          <FederalFormsEditor
            key={active.id}
            returnId={active.id}
            initialInputs={worksheet.extra}
            onDirty={() => setActive((v) => (v ? { ...v, calculation: null } : v))}
            persistInputs={(inputs) => saveWorksheet({ ...worksheet, extra: inputs }, false)}
            onSaved={(inputs) => setWorksheet((v) => ({ ...v, extra: inputs }))}
          />
          <section className="rounded-xl border bg-white p-6">
            <h2 className="text-2xl font-bold">Calculate and review</h2>
            <div className="mt-5 flex flex-wrap gap-4">
              <a
                className={button}
                href={`${endpoint}?returnId=${encodeURIComponent(active.id)}&download=review&revision=${encodeURIComponent(active.updated_at)}`}
              >
                Download saved preparation record
              </a>
              <button
                className={button}
                disabled={busy}
                onClick={() =>
                  void saveWorksheet(worksheet, false).catch((e) => setMessage(e.message))
                }
              >
                Save & calculate federal return
              </button>
              <button
                className={button}
                disabled={busy}
                onClick={() =>
                  void saveWorksheet(worksheet, true).catch((e) => setMessage(e.message))
                }
              >
                Save to review queue
              </button>
            </div>
            <p className="mt-4 text-sm leading-6">The download contains the last saved worksheet and calculation. Save changes first. It is a review record, not an IRS filing receipt.</p>
            {active.calculation && (
              <dl className="mt-6 grid gap-5 sm:grid-cols-3">
                {[
                  ['Total federal tax', active.calculation.totalTax],
                  ['Estimated federal refund', active.calculation.refundAmount],
                  ['Estimated federal amount owed', active.calculation.amountOwed],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-4">
                    <dt>{label}</dt>
                    <dd className="mt-2 text-2xl font-bold">${Number(value).toFixed(2)}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-5 leading-7">
              IRS transmission, acceptance and bank funding are separate verified events. No return
              is marked filed or accepted by saving a worksheet.
            </p>
          </section>
        </section>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border bg-white p-6">
              <h2 className="text-2xl font-bold">Add a client</h2>
              <p className="mt-3 text-sm">
                Enter contact information only. Do not put full tax IDs or bank details in the
                directory.
              </p>
              <form onSubmit={createClient} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="font-semibold sm:col-span-2">
                  Office
                  <select required name="officeId" className={field}>
                    {data.offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.office_name}
                      </option>
                    ))}
                  </select>
                </label>
                {[
                  ['firstName', 'First name'],
                  ['lastName', 'Last name'],
                  ['email', 'Email (optional)'],
                  ['phone', 'Phone (optional)'],
                ].map(([name, label]) => (
                  <label key={name} className="font-semibold">
                    {label}
                    <input
                      name={name}
                      type={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'}
                      required={name.endsWith('Name')}
                      maxLength={name === 'email' ? 200 : name === 'phone' ? 30 : 100}
                      className={field}
                    />
                  </label>
                ))}
                <button disabled={busy} className={button + ' sm:col-span-2'}>
                  Save client
                </button>
              </form>
            </section>
            <section className="rounded-xl border bg-white p-6">
              <h2 className="text-2xl font-bold">Start a client return</h2>
              <form onSubmit={start} className="mt-5 grid gap-4">
                <label className="font-semibold">
                  Client
                  <select required name="clientId" defaultValue="" className={field}>
                    <option value="" disabled>
                      Choose an assigned client
                    </option>
                    {data.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="font-semibold">
                  Tax year
                  <input className={field} value="2026" readOnly />
                </label>
                <label className="font-semibold">
                  Filing status
                  <select name="filingStatus" className={field}>
                    {[
                      ['single', 'Single'],
                      ['married_joint', 'Married filing jointly'],
                      ['married_separate', 'Married filing separately'],
                      ['head_of_household', 'Head of household'],
                      ['qualifying_surviving_spouse', 'Qualifying surviving spouse'],
                    ].map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <button className={button} disabled={busy || !data.clients.length}>
                  Start professional return
                </button>
              </form>
            </section>
          </div>
          <section className="rounded-xl border bg-white p-6">
            <h2 className="text-2xl font-bold">Assigned return worklist</h2>
            <p className="mt-3 text-sm">
              Most recent 100 returns per authorized office. Preparers see their assigned returns;
              owners see their offices.
            </p>
            <div className="mt-5 space-y-4">
              {data.returns.map((r) => {
                const c = data.clients.find((c) => c.id === r.client_id);
                return (
                  <article
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
                  >
                    <div>
                      <h3 className="font-bold">
                        {c ? c.first_name + ' ' + c.last_name : 'Assigned client'}
                      </h3>
                      <p className="mt-2">
                        {r.tax_year} · {r.status.replaceAll('_', ' ')}
                      </p>
                    </div>
                    <button className={button} disabled={busy} onClick={() => void open(r.id)}>
                      Open return
                    </button>
                  </article>
                );
              })}
              {!data.returns.length && (
                <p>No professional returns have been started for your account.</p>
              )}
            </div>
          </section>
          <section className="rounded-xl border bg-white p-6">
            <h2 className="text-2xl font-bold">Client directory</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {data.clients.map((c) => (
                <article key={c.id} className="rounded-lg border p-4">
                  <h3 className="font-bold">
                    {c.first_name} {c.last_name}
                  </h3>
                  <p className="mt-2 break-words">{c.email}</p>
                  <p>{c.phone}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
