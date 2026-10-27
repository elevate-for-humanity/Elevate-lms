'use client';
import { useState } from 'react';
import type { SavedFederalInputs } from '@/lib/tax-software/calculation/input-schema';
const sections = [
  {
    title: 'Additional income',
    fields: [
      ['additionalInterest', 'Taxable interest not already imported'],
      ['taxExemptInterest', 'Tax-exempt interest'],
      ['additionalOrdinaryDividends', 'Ordinary dividends not already imported'],
      ['qualifiedDividends', 'Qualified portion of your total dividends'],
      ['shortTermGainLoss', 'Net short-term capital gain or loss'],
      ['longTermGainLoss', 'Net long-term capital gain or loss'],
      ['taxableIraDistributions', 'Taxable IRA distributions, including imported 1099-R'],
      ['taxablePensions', 'Taxable pensions and annuities, including imported 1099-R'],
      ['socialSecurityBenefits', 'Total Social Security benefits'],
      ['otherSchedule1Income', 'Other Schedule 1 income not already imported'],
    ],
  },
  {
    title: 'Deductions',
    fields: [
      ['adjustments', 'Other Schedule 1 adjustments to income'],
      ['itemizedDeductions', 'Reviewed Schedule A deduction total'],
      [
        'nonItemizerQualifiedContributions',
        'Qualified charitable contributions if taking the standard deduction',
      ],
      ['additionalDeductions', 'Reviewed Schedule 1-A additional deductions'],
      ['qualifiedBusinessIncomeDeduction', 'Reviewed Form 8995 or 8995-A deduction'],
    ],
  },
  {
    title: 'Credits, payments and additional taxes',
    fields: [
      ['nonrefundableCredits', 'Reviewed nonrefundable credits'],
      ['refundableCredits', 'Reviewed refundable credits'],
      ['estimatedPayments', 'Federal estimated payments'],
      ['otherWithholding', 'Federal withholding not already imported'],
      ['schedule2Part1Tax', 'Schedule 2 Part I tax'],
      [
        'otherSchedule2Taxes',
        'Other Schedule 2 tax, excluding calculated self-employment and Medicare tax',
      ],
      ['netInvestmentIncome', 'Reviewed net investment income subject to Form 8960'],
      ['additionalMedicareWithholding', 'Additional Medicare tax already withheld'],
    ],
  },
] as const;
export function FederalFormsEditor({
  returnId,
  initialInputs,
  onSaved,
}: {
  returnId: string;
  initialInputs: SavedFederalInputs;
  onSaved: (inputs: SavedFederalInputs) => void;
}) {
  const [values, setValues] = useState<SavedFederalInputs>(initialInputs),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/tax/returns/forms', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnId, inputs: values }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || 'Unable to save forms');
      onSaved(body.inputs);
      setMessage('Federal form values saved. Recalculate to update your return.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save forms');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-8 rounded-2xl bg-white p-7">
      <h2 className="text-2xl font-bold">Complete federal form values</h2>
      <p className="mt-3 text-slate-600">
        Imported W-2 and 1099 amounts remain in your return. Enter additional amounts once. Capital
        losses use a minus sign. Credit and deduction totals must come from your completed
        supporting forms.
      </p>
      {sections.map((section) => (
        <details key={section.title} className="mt-5 rounded-xl border p-5">
          <summary className="cursor-pointer text-lg font-bold">{section.title}</summary>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {section.fields.map(([key, label]) => (
              <label key={key} className="block text-sm font-semibold">
                {label}
                <input
                  type="number"
                  step="0.01"
                  value={values[key] ?? ''}
                  onChange={(e) => {
                    setValues((v) => ({
                      ...v,
                      [key]: e.target.value === '' ? undefined : Number(e.target.value),
                    }));
                    setMessage('');
                  }}
                  className="mt-2 w-full rounded-lg border p-3"
                />
              </label>
            ))}
          </div>
        </details>
      ))}
      <details className="mt-5 rounded-xl border p-5">
        <summary className="cursor-pointer text-lg font-bold">Family credit worksheets</summary>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label>
            Qualifying children for the child tax credit
            <input
              type="number"
              min="0"
              max="20"
              value={values.childCreditInputs?.qualifyingChildren ?? 0}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  childCreditInputs: {
                    qualifyingChildren: Number(e.target.value),
                    otherDependents: v.childCreditInputs?.otherDependents ?? 0,
                    ssnRequirementsMet: v.childCreditInputs?.ssnRequirementsMet ?? false,
                  },
                }))
              }
              className="mt-2 w-full rounded border p-3"
            />
          </label>
          <label>
            Qualifying other dependents
            <input
              type="number"
              min="0"
              max="20"
              value={values.childCreditInputs?.otherDependents ?? 0}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  childCreditInputs: {
                    qualifyingChildren: v.childCreditInputs?.qualifyingChildren ?? 0,
                    otherDependents: Number(e.target.value),
                    ssnRequirementsMet: v.childCreditInputs?.ssnRequirementsMet ?? false,
                  },
                }))
              }
              className="mt-2 w-full rounded border p-3"
            />
          </label>
          <label className="flex gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={values.childCreditInputs?.ssnRequirementsMet ?? false}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  childCreditInputs: {
                    qualifyingChildren: v.childCreditInputs?.qualifyingChildren ?? 0,
                    otherDependents: v.childCreditInputs?.otherDependents ?? 0,
                    ssnRequirementsMet: e.target.checked,
                  },
                }))
              }
            />
            I verified qualifying-child and dependent requirements and the required valid Social
            Security numbers.
          </label>
          <label>
            Qualifying children for earned income credit
            <input
              type="number"
              min="0"
              max="20"
              value={values.eicInputs?.qualifyingChildren ?? 0}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  eicInputs: {
                    qualifyingChildren: Number(e.target.value),
                    investmentIncome: v.eicInputs?.investmentIncome ?? 0,
                    eligibilityRequirementsMet: v.eicInputs?.eligibilityRequirementsMet ?? false,
                  },
                }))
              }
              className="mt-2 w-full rounded border p-3"
            />
          </label>
          <label>
            Total investment income for the EIC limit
            <input
              type="number"
              min="0"
              value={values.eicInputs?.investmentIncome ?? 0}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  eicInputs: {
                    qualifyingChildren: v.eicInputs?.qualifyingChildren ?? 0,
                    investmentIncome: Number(e.target.value),
                    eligibilityRequirementsMet: v.eicInputs?.eligibilityRequirementsMet ?? false,
                  },
                }))
              }
              className="mt-2 w-full rounded border p-3"
            />
          </label>
          <label className="flex gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={values.eicInputs?.eligibilityRequirementsMet ?? false}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  eicInputs: {
                    qualifyingChildren: v.eicInputs?.qualifyingChildren ?? 0,
                    investmentIncome: v.eicInputs?.investmentIncome ?? 0,
                    eligibilityRequirementsMet: e.target.checked,
                  },
                }))
              }
            />
            I verified EIC age, residency, identification and qualifying-child requirements.
          </label>
        </div>
      </details>
      <details className="mt-5 rounded-xl border p-5">
        <summary className="cursor-pointer text-lg font-bold">Education credit worksheet</summary>
        <div className="mt-5 space-y-4">
          <label className="block">
            Qualified AOTC expenses for each student, separated by commas
            <input
              value={(
                values.educationCreditInputs?.qualifiedAmericanOpportunityExpenses ?? []
              ).join(',')}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  educationCreditInputs: {
                    qualifiedAmericanOpportunityExpenses: e.target.value.trim()
                      ? e.target.value.split(',').map(Number)
                      : [],
                    lifetimeLearningExpenses:
                      v.educationCreditInputs?.lifetimeLearningExpenses ?? 0,
                    aotcEligible: v.educationCreditInputs?.aotcEligible ?? false,
                    llcEligible: v.educationCreditInputs?.llcEligible ?? false,
                    refundableAotcEligible:
                      v.educationCreditInputs?.refundableAotcEligible ?? false,
                  },
                }))
              }
              className="mt-2 w-full rounded border p-3"
            />
          </label>
          <label className="block">
            Qualified lifetime learning expenses, excluding expenses used for AOTC
            <input
              type="number"
              min="0"
              value={values.educationCreditInputs?.lifetimeLearningExpenses ?? 0}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  educationCreditInputs: {
                    qualifiedAmericanOpportunityExpenses:
                      v.educationCreditInputs?.qualifiedAmericanOpportunityExpenses ?? [],
                    lifetimeLearningExpenses: Number(e.target.value),
                    aotcEligible: v.educationCreditInputs?.aotcEligible ?? false,
                    llcEligible: v.educationCreditInputs?.llcEligible ?? false,
                    refundableAotcEligible:
                      v.educationCreditInputs?.refundableAotcEligible ?? false,
                  },
                }))
              }
              className="mt-2 w-full rounded border p-3"
            />
          </label>
          {(
            [
              ['aotcEligible', 'I verified student and expense eligibility for AOTC'],
              [
                'llcEligible',
                'I verified student and expense eligibility for lifetime learning credit',
              ],
              [
                'refundableAotcEligible',
                'I verified eligibility for the refundable portion of AOTC',
              ],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex gap-3">
              <input
                type="checkbox"
                checked={values.educationCreditInputs?.[key] ?? false}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    educationCreditInputs: {
                      qualifiedAmericanOpportunityExpenses:
                        v.educationCreditInputs?.qualifiedAmericanOpportunityExpenses ?? [],
                      lifetimeLearningExpenses:
                        v.educationCreditInputs?.lifetimeLearningExpenses ?? 0,
                      aotcEligible: v.educationCreditInputs?.aotcEligible ?? false,
                      llcEligible: v.educationCreditInputs?.llcEligible ?? false,
                      refundableAotcEligible:
                        v.educationCreditInputs?.refundableAotcEligible ?? false,
                      [key]: e.target.checked,
                    },
                  }))
                }
              />
              {label}
            </label>
          ))}
        </div>
      </details>
      <details className="mt-5 rounded-xl border p-5">
        <summary className="cursor-pointer text-lg font-bold">Dependent care worksheet</summary>
        <p className="mt-3 text-sm">
          Enter eligible care expenses and employer benefits once. Confirm the work-related expense
          and qualifying-person requirements.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ['qualifyingPeople', 'Number of qualifying people'],
              ['qualifiedExpenses', 'Total qualified care expenses'],
              ['excludedBenefits', 'Excluded employer dependent care benefits'],
              ['primaryEarnedIncome', 'Your earned income for the care limit'],
              ['spouseEarnedIncome', 'Spouse earned income for the care limit (joint return)'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min={0}
                step={key === 'qualifyingPeople' ? 1 : '0.01'}
                value={values.dependentCareInputs?.[key] ?? 0}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    dependentCareInputs: {
                      qualifyingPeople: 0,
                      qualifiedExpenses: 0,
                      excludedBenefits: 0,
                      primaryEarnedIncome: 0,
                      eligibilityRequirementsMet: false,
                      ...v.dependentCareInputs,
                      [key]: Number(e.target.value),
                    },
                  }))
                }
                className="mt-2 block w-full rounded border p-3"
              />
            </label>
          ))}
          <label className="flex gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={values.dependentCareInputs?.eligibilityRequirementsMet ?? false}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  dependentCareInputs: {
                    qualifyingPeople: 0,
                    qualifiedExpenses: 0,
                    excludedBenefits: 0,
                    primaryEarnedIncome: 0,
                    ...v.dependentCareInputs,
                    eligibilityRequirementsMet: e.target.checked,
                  },
                }))
              }
            />
            I verified dependent care eligibility and the earned income limits.
          </label>
        </div>
      </details>
      <details className="mt-5 rounded-xl border p-5">
        <summary className="cursor-pointer text-lg font-bold">
          Additional self-employment income
        </summary>
        <p className="mt-3 text-sm">
          Add net business profit or loss only if it is not already in your saved Schedule C or
          imported 1099-NEC.
        </p>
        {(values.selfEmployment ?? []).map((business, index) => (
          <div key={index} className="mt-4 flex flex-wrap gap-3">
            <label>
              Income belongs to
              <select
                value={business.owner ?? 'primary'}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    selfEmployment: v.selfEmployment?.map((b, i) =>
                      i === index ? { ...b, owner: e.target.value as 'primary' | 'spouse' } : b,
                    ),
                  }))
                }
                className="ml-2 rounded border p-2"
              >
                <option value="primary">Taxpayer</option>
                <option value="spouse">Spouse (joint return)</option>
              </select>
            </label>
            <label>
              Net profit or loss
              <input
                type="number"
                step="0.01"
                value={business.netProfit}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    selfEmployment: v.selfEmployment?.map((b, i) =>
                      i === index ? { ...b, netProfit: Number(e.target.value) } : b,
                    ),
                  }))
                }
                className="ml-2 rounded border p-2"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setValues((v) => ({
                  ...v,
                  selfEmployment: v.selfEmployment?.filter((_, i) => i !== index),
                }))
              }
              className="text-red-700 underline"
            >
              Remove business
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setValues((v) => ({
              ...v,
              selfEmployment: [...(v.selfEmployment ?? []), { owner: 'primary', netProfit: 0 }],
            }))
          }
          className="mt-4 font-semibold text-red-700 underline"
        >
          Add business income
        </button>
      </details>
      <details className="mt-5 rounded-xl border p-5">
        <summary className="cursor-pointer text-lg font-bold">
          Standard deduction and household choices
        </summary>
        <div className="mt-4 space-y-4">
          {[
            ['claimedAsDependent', 'Someone can claim you as a dependent'],
            ['mustItemize', 'You must itemize deductions'],
            [
              'marriedSeparateLivedWithSpouse',
              'Married filing separately and lived with your spouse during the year',
            ],
          ].map(([key, label]) => (
            <label key={key} className="flex gap-3">
              <input
                type="checkbox"
                checked={values[key as keyof SavedFederalInputs] === true}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
          <label className="block">
            Number of eligible age 65 or blindness boxes
            <input
              type="number"
              min={0}
              max={4}
              step={1}
              value={values.additionalStandardDeductionBoxes ?? 0}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  additionalStandardDeductionBoxes: Number(e.target.value),
                }))
              }
              className="ml-3 w-20 rounded border p-2"
            />
          </label>
        </div>
      </details>
      {error && (
        <p role="alert" className="mt-4 text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-4 text-emerald-800">
          {message}
        </p>
      )}
      <button
        onClick={() => void save()}
        disabled={busy}
        className="mt-6 rounded-xl bg-red-700 px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save federal forms'}
      </button>
    </section>
  );
}
