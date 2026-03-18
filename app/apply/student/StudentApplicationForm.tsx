'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { submitStudentApplication } from '../actions';
import { getActiveProgramsByCategory } from '@/lib/program-registry';
import { trackEvent } from '@/components/analytics/google-analytics';
import {
  evaluateFundingEligibility,
  type EligibilityInput,
  type FundingOption,
} from '@/lib/enrollment/funding-eligibility';
import {
  CheckCircle, ExternalLink, AlertTriangle, Info, ChevronDown, ChevronUp,
} from 'lucide-react';

const programGroups = getActiveProgramsByCategory();

// Programs that are always self-pay — funding selector is hidden
const SELF_PAY_ONLY_PROGRAMS = new Set(['barber-apprenticeship']);

const INPUT_CLS =
  'w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

export default function StudentApplicationForm({ initialProgram = '' }: { initialProgram?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Eligibility screening fields
  const [programInterest, setProgramInterest] = useState(initialProgram);
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [householdSize, setHouseholdSize] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [justiceInvolved, setJusticeInvolved] = useState(false);
  const [hasEmployerSponsor, setHasEmployerSponsor] = useState(false);

  // Funding selection
  const [selectedFunding, setSelectedFunding] = useState<FundingOption | null>(null);
  const [expandedInstructions, setExpandedInstructions] = useState<string | null>(null);
  const [hasWorkOneApproval, setHasWorkOneApproval] = useState(false);
  const [workoneRef, setWorkoneRef] = useState('');

  const isSelfPayOnly = SELF_PAY_ONLY_PROGRAMS.has(programInterest);

  // Run eligibility engine whenever screening fields change
  const eligibility = useMemo(() => {
    if (isSelfPayOnly) return null;
    const income = parseInt(annualIncome, 10);
    const size = parseInt(householdSize, 10);
    if (!employmentStatus || !income || !size) return null;

    const input: EligibilityInput = {
      employmentStatus,
      householdSize: size,
      annualIncomeUsd: income,
      justiceInvolved,
      hasEmployerSponsor,
      hasWorkOneApproval,
      programSlug: programInterest,
    };
    return evaluateFundingEligibility(input);
  }, [
    employmentStatus, householdSize, annualIncome,
    justiceInvolved, hasEmployerSponsor, hasWorkOneApproval,
    programInterest, isSelfPayOnly,
  ]);

  // WorkOne gate: selected WorkOne/WIOA but no approval yet
  const needsWorkOneApproval =
    selectedFunding?.source === 'workone_wioa' && !hasWorkOneApproval;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    if (formData.get('website_url')) {
      router.push('/');
      return;
    }

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!isSelfPayOnly && !selectedFunding) {
      setError('Please select a funding option before submitting.');
      setLoading(false);
      return;
    }

    if (needsWorkOneApproval) {
      setError('You must complete WorkOne intake and confirm your approval before submitting.');
      setLoading(false);
      return;
    }

    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      password,
      dateOfBirth: formData.get('dateOfBirth') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zipCode: formData.get('zipCode') as string,
      programInterest,
      employmentStatus,
      educationLevel: formData.get('educationLevel') as string,
      goals: formData.get('goals') as string,
      role: 'student' as const,
      // Funding eligibility fields
      requestedFundingSource: isSelfPayOnly ? 'self_pay' : (selectedFunding?.enrollmentFundingSource ?? 'self_pay'),
      householdSize: parseInt(householdSize, 10) || null,
      annualIncomeUsd: parseInt(annualIncome, 10) || null,
      justiceInvolved,
      hasEmployerSponsor,
      hasWorkOneApproval,
      workoneApprovalRef: workoneRef || null,
      eligibilityData: eligibility
        ? {
            recommended: eligibility.recommended.enrollmentFundingSource,
            options: eligibility.options.map(o => ({ source: o.enrollmentFundingSource, status: o.status })),
          }
        : null,
    };

    try {
      trackEvent('form_submit', 'application', data.programInterest);
      const result = await submitStudentApplication(data);

      if (result.success) {
        trackEvent('application_complete', 'conversion', data.programInterest);
        // WorkOne-pending applications land on a holding page
        if (result.status === 'pending_workone') {
          const qs = new URLSearchParams();
          if (result.referenceNumber) qs.set('ref', result.referenceNumber);
          if (selectedFunding?.enrollmentFundingSource) qs.set('funding', selectedFunding.enrollmentFundingSource);
          router.push(`/apply/pending-workone?${qs.toString()}`);
          return;
        }
        router.push('/onboarding/learner');
        return;
      } else {
        setError(
          result.error ||
          'Something went wrong submitting your application. Please try again or contact us at info@elevateforhumanity.org.',
        );
        setLoading(false);
      }
    } catch {
      setError(
        'The application system is temporarily unavailable. Please email us at info@elevateforhumanity.org with your name, phone, and program interest.',
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <label htmlFor="website_url">Website</label>
        <input type="text" id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* ── Personal Information ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-black mb-2">First Name *</label>
            <input type="text" id="firstName" name="firstName" required className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-black mb-2">Last Name *</label>
            <input type="text" id="lastName" name="lastName" required className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">Email *</label>
            <input type="email" id="email" name="email" required className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">Phone *</label>
            <input type="tel" id="phone" name="phone" required className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-2">Create Password *</label>
            <input type="password" id="password" name="password" required minLength={8} placeholder="At least 8 characters" className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">Confirm Password *</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required minLength={8} className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-black mb-2">Date of Birth</label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" className={INPUT_CLS} />
          </div>
        </div>
      </div>

      {/* ── Address ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">Address</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-black mb-2">Street Address</label>
            <input type="text" id="address" name="address" className={INPUT_CLS} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-black mb-2">City</label>
              <input type="text" id="city" name="city" className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-black mb-2">State</label>
              <select id="state" name="state" className={INPUT_CLS}>
                <option value="">Select State</option>
                <option value="IN">Indiana</option>
                <option value="IL">Illinois</option>
                <option value="OH">Ohio</option>
                <option value="KY">Kentucky</option>
                <option value="MI">Michigan</option>
              </select>
            </div>
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-black mb-2">ZIP Code</label>
              <input type="text" id="zipCode" name="zipCode" className={INPUT_CLS} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Program & Background ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">Program Interest</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="programInterest" className="block text-sm font-medium text-black mb-2">
              Which program interests you?
            </label>
            <select
              id="programInterest"
              name="programInterest"
              value={programInterest}
              onChange={e => { setProgramInterest(e.target.value); setSelectedFunding(null); }}
              className={INPUT_CLS}
            >
              <option value="">Select a program</option>
              {programGroups.map(group => (
                <optgroup key={group.category} label={group.category}>
                  {group.programs.map(p => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </optgroup>
              ))}
              <option value="not-sure">Not Sure Yet</option>
            </select>
          </div>

          <div>
            <label htmlFor="employmentStatus" className="block text-sm font-medium text-black mb-2">
              Current Employment Status
            </label>
            <select
              id="employmentStatus"
              name="employmentStatus"
              value={employmentStatus}
              onChange={e => { setEmploymentStatus(e.target.value); setSelectedFunding(null); }}
              className={INPUT_CLS}
            >
              <option value="">Select status</option>
              <option value="unemployed">Unemployed</option>
              <option value="part_time">Part-time Employed</option>
              <option value="full_time">Full-time Employed</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label htmlFor="educationLevel" className="block text-sm font-medium text-black mb-2">
              Highest Education Level
            </label>
            <select id="educationLevel" name="educationLevel" className={INPUT_CLS}>
              <option value="">Select level</option>
              <option value="no-hs">No High School Diploma</option>
              <option value="ged">GED</option>
              <option value="hs-diploma">High School Diploma</option>
              <option value="some-college">Some College</option>
              <option value="associates">Associate's Degree</option>
              <option value="bachelors">Bachelor's Degree</option>
              <option value="graduate">Graduate Degree</option>
            </select>
          </div>

          <div>
            <label htmlFor="goals" className="block text-sm font-medium text-black mb-2">
              What are your career goals?
            </label>
            <textarea
              id="goals"
              name="goals"
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Tell us about your career aspirations..."
            />
          </div>
        </div>
      </div>

      {/* ── Funding Eligibility Screening ────────────────────────────────── */}
      {!isSelfPayOnly && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-black mb-1">Funding & Financial Information</h2>
          <p className="text-sm text-slate-500 mb-4">
            This helps us identify funding options that may cover your tuition at no cost to you.
            Your answers are confidential.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="householdSize" className="block text-sm font-medium text-black mb-2">
                Household Size *
              </label>
              <select
                id="householdSize"
                value={householdSize}
                onChange={e => { setHouseholdSize(e.target.value); setSelectedFunding(null); }}
                className={INPUT_CLS}
                required={!isSelfPayOnly}
              >
                <option value="">Select size</option>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                ))}
                <option value="9">9 or more</option>
              </select>
            </div>

            <div>
              <label htmlFor="annualIncome" className="block text-sm font-medium text-black mb-2">
                Estimated Annual Household Income *
              </label>
              <select
                id="annualIncome"
                value={annualIncome}
                onChange={e => { setAnnualIncome(e.target.value); setSelectedFunding(null); }}
                className={INPUT_CLS}
                required={!isSelfPayOnly}
              >
                <option value="">Select range</option>
                <option value="0">$0 (no income)</option>
                <option value="10000">Under $10,000</option>
                <option value="15000">$10,000 – $15,000</option>
                <option value="20000">$15,000 – $20,000</option>
                <option value="25000">$20,000 – $25,000</option>
                <option value="30000">$25,000 – $30,000</option>
                <option value="35000">$30,000 – $35,000</option>
                <option value="40000">$35,000 – $40,000</option>
                <option value="50000">$40,000 – $50,000</option>
                <option value="60000">$50,000 – $60,000</option>
                <option value="75000">$60,000 – $75,000</option>
                <option value="100000">Over $75,000</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={justiceInvolved}
                onChange={e => { setJusticeInvolved(e.target.checked); setSelectedFunding(null); }}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600"
              />
              <span className="text-sm text-slate-700">
                I have been involved in the justice system (may qualify for additional funding)
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEmployerSponsor}
                onChange={e => { setHasEmployerSponsor(e.target.checked); setSelectedFunding(null); }}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600"
              />
              <span className="text-sm text-slate-700">
                My employer has agreed to sponsor my training
              </span>
            </label>
          </div>

          {/* ── Funding options ── */}
          {eligibility && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-800 mb-3">
                Based on your answers, here are your funding options:
              </p>

              <div className="space-y-3">
                {eligibility.options
                  .filter(o => o.status !== 'not_eligible')
                  .map(option => {
                    const isSelected = selectedFunding?.source === option.source;
                    const isOpen = expandedInstructions === option.source;
                    const isWorkOne = option.source === 'workone_wioa';

                    return (
                      <div
                        key={option.source}
                        className={`rounded-xl border-2 transition-colors ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Option header */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFunding(isSelected ? null : option);
                            setExpandedInstructions(isSelected ? null : option.source);
                          }}
                          className="w-full text-left px-4 py-3 flex items-start gap-3"
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-slate-900">{option.label}</span>
                              {option.status === 'likely_eligible' && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                  Likely eligible
                                </span>
                              )}
                              {option.status === 'requires_external' && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                  WorkOne determines eligibility
                                </span>
                              )}
                              {option.status === 'possible' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                  May qualify
                                </span>
                              )}
                              {option.source === 'self_pay' && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  Always available
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{option.reason}</p>
                          </div>

                          <div className="shrink-0 text-slate-400">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>

                        {/* Instructions panel */}
                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                            {/* WorkOne gate — must complete before applying */}
                            {isWorkOne && (
                              <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 font-medium">
                                  <strong>Complete WorkOne intake before submitting this application.</strong>{' '}
                                  WorkOne — not Elevate — determines your WIOA eligibility.
                                  Your application will be held until WorkOne confirms your approval.
                                </p>
                              </div>
                            )}

                            <ol className="space-y-1.5 mb-3">
                              {option.instructions.map((step, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                  <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-xs">
                                    {i + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>

                            {option.externalUrl && (
                              <a
                                href={option.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-blue-700 hover:bg-brand-blue-800 px-3 py-1.5 rounded-lg transition"
                              >
                                Find a WorkOne location <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {/* WorkOne approval confirmation */}
                            {isWorkOne && isSelected && (
                              <div className="mt-3 space-y-2">
                                <label className="flex items-start gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hasWorkOneApproval}
                                    onChange={e => setHasWorkOneApproval(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600"
                                  />
                                  <span className="text-xs text-slate-700 font-medium">
                                    I have completed WorkOne intake and have my approval / authorization
                                  </span>
                                </label>

                                {hasWorkOneApproval && (
                                  <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                      WorkOne authorization code or case number (optional but recommended)
                                    </label>
                                    <input
                                      type="text"
                                      value={workoneRef}
                                      onChange={e => setWorkoneRef(e.target.value)}
                                      placeholder="e.g. WO-2025-XXXXX"
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>
                                )}

                                {!hasWorkOneApproval && (
                                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-2">
                                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700">
                                      You can still submit — your application will be held at
                                      <strong> Pending WorkOne</strong> status until you return with confirmation.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {eligibility.hasSponsoredOption && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Sponsored funding options are available for your situation. Select one above.
                </p>
              )}
            </div>
          )}

          {/* Prompt to fill in screening fields */}
          {!eligibility && employmentStatus && (
            <p className="text-xs text-slate-500 mt-2">
              Enter your household size and income to see funding options.
            </p>
          )}
        </div>
      )}

      {/* Self-pay only notice */}
      {isSelfPayOnly && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            The Barber Apprenticeship program is self-pay. Payment plans are available —
            contact us at 317-314-3757 to discuss options.
          </p>
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-h-[48px] px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-[48px] px-6 py-3 bg-white border-2 border-slate-300 text-black font-semibold rounded-lg hover:border-slate-400 transition-colors"
        >
          Back
        </button>
      </div>
    </form>
  );
}
