'use client';
import { useState, type FormEvent } from 'react';
import { W9_CERTIFICATION, W9_CERTIFICATION_INSTRUCTIONS } from '@/lib/program-holder/w9-form';
export function GuidedW9Form() {
  const [step, setStep] = useState(1),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [classification, setClassification] = useState('individual');
  const [backup, setBackup] = useState(false);
  const [download, setDownload] = useState('');
  const input = 'min-h-12 w-full min-w-0 rounded-xl border bg-white p-3 font-normal';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    const form = event.currentTarget,
      data = new FormData(form);
    setBusy(true);
    setMessage('');
    const body = Object.fromEntries(data);
    try {
      const response = await fetch('/api/program-holder/forms/w9', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...body,
          foreignOwners: data.get('foreignOwners') === 'on',
          backupWithholding: backup,
          usPerson: data.get('usPerson') === 'on',
          certified: data.get('certified') === 'on',
        }),
      });
      if (!response.headers.get('content-type')?.includes('application/json'))
        throw new Error('Sign in again before saving your W-9.');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your W-9 could not be saved.');
      setDownload(result.downloadUrl);
      setMessage(result.message);
      form.reset();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to save. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="rounded-2xl border border-blue-200 bg-white p-5">
      <summary className="min-h-12 cursor-pointer text-xl font-black">
        Complete and save my W-9
      </summary>
      <p className="my-3 text-sm">
        No printing or uploading needed. Complete three steps, then sign. Your tax number is saved
        only inside your protected PDF. Review your tax records; format checks do not verify a
        name/TIN match with the IRS.
      </p>
      <a
        href="https://www.irs.gov/pub/irs-pdf/fw9.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center text-blue-800 underline"
      >
        Official IRS W-9 and complete instructions
      </a>
      {download ? (
        <div role="status" className="rounded-xl bg-blue-50 p-4">
          {message}{' '}
          <a href={download} className="block min-h-11 font-bold underline">
            View or download my signed W-9
          </a>
          <a href="/program-holder/documents" className="block min-h-11 font-bold underline">
            Refresh my document register
          </a>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4" autoComplete="off">
          <p className="font-bold">
            Step {step} of 3 ·{' '}
            {
              [
                'Name and tax classification',
                'Address and tax number',
                'Review certification and sign',
              ][step - 1]
            }
          </p>
          <fieldset hidden={step !== 1} disabled={busy} className="space-y-4">
            <label className="block text-sm font-bold">
              Line 1 · Name as shown on your tax return
              <input name="legalName" required={step === 1} maxLength={150} className={input} />
              <span className="font-normal">
                Sole proprietor or disregarded LLC: enter the owner’s name here.
              </span>
            </label>
            <label className="block text-sm font-bold">
              Line 2 · Business / disregarded entity name, if different
              <input name="businessName" maxLength={150} className={input} />
            </label>
            <label className="block text-sm font-bold">
              Line 3a · Federal tax classification
              <select
                name="classification"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className={input}
              >
                {[
                  ['individual', 'Individual / sole proprietor'],
                  ['c_corp', 'C corporation'],
                  ['s_corp', 'S corporation'],
                  ['partnership', 'Partnership'],
                  ['trust', 'Trust / estate'],
                  ['llc', 'LLC (not a disregarded entity)'],
                  ['other', 'Other'],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm">
              A disregarded LLC uses the owner’s classification, rather than the LLC box. If unsure,
              check your tax records or ask your tax preparer.
            </p>
            <label hidden={classification !== 'llc'} className="block text-sm font-bold">
              LLC tax classification
              <select
                name="llcClass"
                required={step === 1 && classification === 'llc'}
                className={input}
              >
                <option value="">Select</option>
                <option value="C">C corporation</option>
                <option value="S">S corporation</option>
                <option value="P">Partnership</option>
              </select>
            </label>
            <label hidden={classification !== 'other'} className="block text-sm font-bold">
              Other classification
              <input
                name="otherClass"
                required={step === 1 && classification === 'other'}
                maxLength={100}
                className={input}
              />
            </label>
            <label className="flex min-h-12 gap-3 text-sm">
              <input name="foreignOwners" type="checkbox" className="h-11 w-11 shrink-0" />
              Line 3b: I have foreign partners, owners or beneficiaries AND I am providing this form
              to a partnership, trust or estate in which I have an ownership interest, with an
              eligible classification on line 3a. Leave unchecked when not applicable; see IRS
              instructions.
            </label>
          </fieldset>
          <fieldset hidden={step !== 2} disabled={busy} className="space-y-4">
            <label className="block text-sm font-bold">
              Line 4 · Exempt payee code (if applicable)
              <input name="exemptPayee" maxLength={2} pattern="([1-9]|1[0-3])?" className={input} />
            </label>
            <label className="block text-sm font-bold">
              FATCA exemption code (if applicable)
              <input name="fatca" maxLength={1} pattern="[A-Ma-m]?" className={input} />
            </label>
            <p className="text-sm">
              Exemption codes apply only in specific cases. Do not guess a code. Most individuals
              leave these blank; FATCA codes generally concern accounts outside the United States.
            </p>
            <label className="block text-sm font-bold">
              Line 5 · Mailing street address
              <input name="address" required={step === 2} maxLength={200} className={input} />
            </label>
            <label className="block text-sm font-bold">
              Line 6 · City, state and ZIP
              <input name="cityStateZip" required={step === 2} maxLength={150} className={input} />
            </label>
            <label className="block text-sm font-bold">
              Line 7 · Account reference numbers (optional; not banking information)
              <input name="accounts" maxLength={150} className={input} />
            </label>
            <label className="block text-sm font-bold">
              Part I · Taxpayer ID type
              <select name="tinType" className={input}>
                <option value="ssn">SSN</option>
                <option value="ein">EIN</option>
              </select>
            </label>
            <label className="block text-sm font-bold">
              Nine-digit taxpayer ID matching line 1
              <input
                name="tin"
                type="password"
                inputMode="numeric"
                required={step === 2}
                pattern="[0-9\-\s]{9,11}"
                maxLength={11}
                autoComplete="off"
                className={input}
              />
            </label>
            <p className="text-sm">
              Use the IRS instructions for whose name and number to enter. Do not enter a bank
              account number here.
            </p>
          </fieldset>
          <fieldset hidden={step !== 3} disabled={busy} className="space-y-4">
            <p className="text-sm">
              Use Back to review your entries before signing. The saved PDF includes the completed
              form, certification, signature and date.
            </p>
            <label className="flex min-h-12 gap-3 text-sm">
              <input
                type="checkbox"
                checked={backup}
                onChange={(e) => setBackup(e.target.checked)}
                className="h-11 w-11 shrink-0"
              />
              The IRS has notified me that I am currently subject to backup withholding for failure
              to report interest or dividends. Cross out certification item 2.
            </label>
            <div className="rounded-xl border p-4 text-sm space-y-3">
              {W9_CERTIFICATION.map((line, index) => (
                <p key={line} className={index === 2 && backup ? 'line-through' : ''}>
                  {line}
                </p>
              ))}
              <p>{W9_CERTIFICATION_INSTRUCTIONS}</p>
            </div>
            <label className="flex min-h-12 gap-3 text-sm">
              <input
                name="usPerson"
                type="checkbox"
                required={step === 3}
                className="h-11 w-11 shrink-0"
              />
              I am a U.S. person. If you are not a U.S. person, contact Elevate for the appropriate
              W-8 form.
            </label>
            <label className="flex min-h-12 gap-3 text-sm">
              <input
                name="certified"
                type="checkbox"
                required={step === 3}
                className="h-11 w-11 shrink-0"
              />
              I reviewed this W-9 and certify it under penalties of perjury, with item 2 crossed out
              if indicated above. I consent to sign electronically.
            </label>
            <label className="block text-sm font-bold">
              Final entry · Type your full name as your electronic signature
              <input name="signature" required={step === 3} maxLength={150} className={input} />
            </label>
          </fieldset>
          <div className="flex flex-wrap gap-3">
            {step > 1 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep(step - 1)}
                className="min-h-12 rounded-xl border px-5"
              >
                Back and review
              </button>
            )}
            <button
              disabled={busy}
              className="min-h-12 rounded-xl bg-blue-800 px-5 font-bold text-white"
            >
              {busy ? 'Saving…' : step < 3 ? 'Continue' : 'Sign and save W-9'}
            </button>
          </div>
          {message && <p role="alert">{message}</p>}
        </form>
      )}
    </details>
  );
}
