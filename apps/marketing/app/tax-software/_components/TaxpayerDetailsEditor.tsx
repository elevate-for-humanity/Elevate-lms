'use client';
import { useState } from 'react';
export function TaxpayerDetailsEditor({
  returnId,
  joint,
  onSaved,
}: {
  returnId: string;
  joint: boolean;
  onSaved: () => void;
}) {
  const [v, setV] = useState<Record<string, string>>({}),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  const groups = [
    {
      title: 'Taxpayer',
      fields: [
        ['firstName', 'First name'],
        ['lastName', 'Last name'],
        ['ssn', 'Social Security number or ITIN'],
        ['birthDate', 'Date of birth'],
        ['occupation', 'Occupation'],
      ],
    },
    ...(joint
      ? [
          {
            title: 'Spouse',
            fields: [
              ['spouseFirstName', 'Spouse first name'],
              ['spouseLastName', 'Spouse last name'],
              ['spouseSsn', 'Spouse Social Security number or ITIN'],
              ['spouseBirthDate', 'Spouse date of birth'],
            ],
          },
        ]
      : []),
    {
      title: 'Mailing address',
      fields: [
        ['line1', 'Street address'],
        ['line2', 'Apartment or suite'],
        ['city', 'City'],
        ['state', 'State abbreviation'],
        ['zip', 'ZIP code'],
      ],
    },
    {
      title: 'Electronic signature',
      fields: [
        ['taxpayerPin', 'Your five-digit signature PIN'],
        ['priorYearAgi', 'Prior-year adjusted gross income'],
        ...(joint
          ? [
              ['spousePin', 'Spouse five-digit signature PIN'],
              ['spousePriorYearAgi', 'Spouse prior-year adjusted gross income'],
            ]
          : []),
      ],
    },
  ];
  async function save() {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      if (!v.priorYearAgi?.trim() || (joint && !v.spousePriorYearAgi?.trim()))
        throw Error(
          'Enter the prior-year AGI. Enter 0 only if the applicable IRS instructions allow it.',
        );
      const privateFields = {
        profile: {
          firstName: v.firstName,
          lastName: v.lastName,
          ssn: v.ssn,
          birthDate: v.birthDate,
          occupation: v.occupation || undefined,
          address: {
            line1: v.line1,
            line2: v.line2 || undefined,
            city: v.city,
            state: v.state?.toUpperCase(),
            zip: v.zip,
          },
          ...(joint
            ? {
                spouse: {
                  firstName: v.spouseFirstName,
                  lastName: v.spouseLastName,
                  ssn: v.spouseSsn,
                  birthDate: v.spouseBirthDate,
                },
              }
            : {}),
        },
        signature: {
          taxpayerPin: v.taxpayerPin,
          priorYearAgi: Number(v.priorYearAgi),
          signatureDate: new Date().toISOString().slice(0, 10),
          authorizationRecorded: consent,
          ...(joint
            ? { spousePin: v.spousePin, spousePriorYearAgi: Number(v.spousePriorYearAgi) }
            : {}),
        },
      };
      const response = await fetch('/api/tax/returns/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnId, privateFields }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || 'Unable to save taxpayer details');
      setSaved(true);
      setV({});
      setConsent(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save taxpayer details');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-8 rounded-2xl border bg-white p-7">
      <h2 className="text-2xl font-bold">Taxpayer details and signature</h2>
      <p className="mt-3 text-slate-600">
        Calculate and review the return before authorizing your electronic signature. Your
        identification and PIN are encrypted when saved and are cleared from this form after saving.
      </p>
      {groups.map((group) => (
        <details key={group.title} className="mt-5 rounded-xl border p-5">
          <summary className="cursor-pointer font-bold">{group.title}</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {group.fields.map(([key, label]) => (
              <label key={key} className="block text-sm font-semibold">
                {label}
                <input
                  type={
                    key.toLowerCase().includes('ssn') || key.toLowerCase().includes('pin')
                      ? 'password'
                      : key.toLowerCase().includes('birthdate')
                        ? 'date'
                        : 'text'
                  }
                  autoComplete="off"
                  value={v[key] ?? ''}
                  onChange={(e) => {
                    setV((x) => ({ ...x, [key]: e.target.value }));
                    setConsent(false);
                  }}
                  className="mt-2 w-full rounded border p-3"
                />
              </label>
            ))}
          </div>
        </details>
      ))}
      <label className="mt-6 flex items-start gap-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          I reviewed my return, confirm the information is accurate, and authorize my entered PIN as
          my electronic signature. I have read the declaration on{' '}
          <a
            className="font-semibold text-blue-800 underline"
            href="https://www.irs.gov/pub/irs-pdf/f1040.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Form 1040
          </a>
          .
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-4 text-red-800">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-4 text-emerald-800">
          Taxpayer details and signature saved securely.
        </p>
      )}
      <button
        onClick={() => void save()}
        disabled={busy || !consent}
        className="mt-6 rounded-xl bg-red-700 px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save details and authorize signature'}
      </button>
    </section>
  );
}
