'use client';
import { DEPENDENT_RELATIONSHIPS, type TaxDependent } from '@/lib/tax-software/mef/family-types';
export function DependentsEditor({
  value,
  onChange,
}: {
  value: TaxDependent[];
  onChange: (value: TaxDependent[]) => void;
}) {
  const update = (index: number, patch: Partial<TaxDependent>) =>
    onChange(value.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  const flags = [
    ['claimedAsDependent', 'I am claiming this dependent'],
    ['qualifiesChildTaxCredit', 'Meets child tax credit requirements'],
    ['qualifiesOtherDependentCredit', 'Meets credit for other dependents requirements'],
    ['qualifiesEic', 'Meets qualifying child requirements for earned income credit'],
    ['livedInUsOverHalfYear', 'Lived in the United States more than half the year'],
    ['studentUnder24', 'Qualifying student under age 24'],
    ['permanentlyDisabled', 'Permanently and totally disabled'],
  ] as const;
  return (
    <details className="mt-5 rounded-xl border p-5">
      <summary className="cursor-pointer font-bold">Dependents and qualifying children</summary>
      <p className="mt-3 text-sm text-slate-600">
        Review IRS eligibility rules before selecting credits. These details must match your
        reviewed credit worksheets. Identification numbers are encrypted with your taxpayer details.
      </p>
      {value.map((d, index) => (
        <fieldset key={index} className="mt-5 rounded border p-4">
          <legend className="font-semibold">Child or dependent {index + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ['firstName', 'First name'],
                ['lastName', 'Last name'],
                ['ssn', 'Social Security number or ITIN'],
                ['birthDate', 'Date of birth'],
                ['identityProtectionPin', 'Identity protection PIN, if issued'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-sm font-semibold">
                {label}
                <input
                  autoComplete="off"
                  type={
                    key === 'birthDate'
                      ? 'date'
                      : key === 'ssn' || key === 'identityProtectionPin'
                        ? 'password'
                        : 'text'
                  }
                  value={d[key] ?? ''}
                  onChange={(e) =>
                    update(index, {
                      [key]: e.target.value || (key === 'identityProtectionPin' ? undefined : ''),
                    })
                  }
                  className="mt-2 w-full rounded border p-3"
                />
              </label>
            ))}
            <label className="text-sm font-semibold">
              Relationship
              <select
                value={d.relationship}
                onChange={(e) =>
                  update(index, { relationship: e.target.value as TaxDependent['relationship'] })
                }
                className="mt-2 w-full rounded border p-3"
              >
                {DEPENDENT_RELATIONSHIPS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Months lived with you
              <input
                type="number"
                min={0}
                max={12}
                step={1}
                value={d.monthsLivedWithTaxpayer}
                onChange={(e) => update(index, { monthsLivedWithTaxpayer: Number(e.target.value) })}
                className="mt-2 w-full rounded border p-3"
              />
            </label>
          </div>
          <div className="mt-4 grid gap-3">
            {flags.map(([key, label]) => (
              <label key={key} className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={d[key]}
                  onChange={(e) =>
                    update(index, {
                      [key]: e.target.checked,
                      ...(key === 'qualifiesChildTaxCredit' && e.target.checked
                        ? { qualifiesOtherDependentCredit: false }
                        : {}),
                      ...(key === 'qualifiesOtherDependentCredit' && e.target.checked
                        ? { qualifiesChildTaxCredit: false }
                        : {}),
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            className="mt-4 font-semibold text-red-800"
          >
            Remove dependent {index + 1}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        disabled={value.length >= 20}
        onClick={() =>
          onChange([
            ...value,
            {
              firstName: '',
              lastName: '',
              ssn: '',
              birthDate: '',
              relationship: 'SON',
              claimedAsDependent: true,
              qualifiesChildTaxCredit: false,
              qualifiesOtherDependentCredit: false,
              qualifiesEic: false,
              monthsLivedWithTaxpayer: 0,
              livedInUsOverHalfYear: false,
              studentUnder24: false,
              permanentlyDisabled: false,
            },
          ])
        }
        className="mt-4 rounded border px-4 py-2 font-semibold disabled:opacity-50"
      >
        Add child or dependent
      </button>
    </details>
  );
}
