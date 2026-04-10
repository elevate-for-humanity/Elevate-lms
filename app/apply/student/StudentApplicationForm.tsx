'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitStudentApplication } from '../actions';
import { getActiveProgramsByCategory } from '@/lib/program-registry';
import { trackEvent } from '@/components/analytics/google-analytics';
import { XCircle, AlertCircle, CheckCircle } from 'lucide-react';

const programGroups = getActiveProgramsByCategory();

// Programs that have a waitlist — show waitlist link instead of enrollment form
const WAITLIST_PROGRAMS = new Set(['cdl-training', 'barber-apprenticeship']);

// ── Eligibility screening state ───────────────────────────────────────────────
interface EligibilityAnswers {
  // Funding
  hasSnap: boolean | null;
  hasTanf: boolean | null;
  hasReferral: boolean | null;
  referralSource: string;
  caseManagerName: string;
  caseManagerEmail: string;
  otherFundingSource: string;
  // Residency / age
  isAdult: boolean | null;
  isIndianaResident: boolean | null;
  // Education
  educationLevel: string;
  hasDiplomaOrGed: boolean | null;
  enrolledInGed: boolean | null;
  // Legal
  workAuthorized: boolean | null;
  activeWarrant: boolean | null;
  pendingCharges: boolean | null;
  onProbationParole: boolean | null;
  legalNotes: string;
  // Readiness
  canAttendSchedule: boolean | null;
  hasTransportationPlan: boolean | null;
  canMeetPhysical: boolean | null;
  willingToFollowRules: boolean | null;
  willingJobReadiness: boolean | null;
  unavailableTimes: string;
  motivation: string;
  // Acknowledgments
  agreesVerification: boolean;
  agreesAttendance: boolean;
}

const EMPTY_ELIGIBILITY: EligibilityAnswers = {
  hasSnap: null, hasTanf: null, hasReferral: null,
  referralSource: '', caseManagerName: '', caseManagerEmail: '', otherFundingSource: '',
  isAdult: null, isIndianaResident: null,
  educationLevel: '', hasDiplomaOrGed: null, enrolledInGed: null,
  workAuthorized: null, activeWarrant: null, pendingCharges: null,
  onProbationParole: null, legalNotes: '',
  canAttendSchedule: null, hasTransportationPlan: null, canMeetPhysical: null,
  willingToFollowRules: null, willingJobReadiness: null,
  unavailableTimes: '', motivation: '',
  agreesVerification: false, agreesAttendance: false,
};

// ── Decision engine ───────────────────────────────────────────────────────────
type EligibilityStatus = 'eligible' | 'conditional_review' | 'ineligible' | 'incomplete';

interface EligibilityDecision {
  status: EligibilityStatus;
  reasonCodes: string[];
}

function evaluateEligibility(a: EligibilityAnswers): EligibilityDecision {
  const codes: string[] = [];

  // Hard stops — ineligible
  if (a.isAdult === false)              codes.push('UNDER_18');
  if (a.isIndianaResident === false)    codes.push('NON_INDIANA_RESIDENT');
  if (a.workAuthorized === false)       codes.push('NO_WORK_AUTH');
  if (a.activeWarrant === true)         codes.push('ACTIVE_WARRANT');
  if (a.canAttendSchedule === false)    codes.push('ATTENDANCE_CONFLICT');
  if (a.agreesVerification === false)   codes.push('ACKNOWLEDGMENT_MISSING');
  if (a.agreesAttendance === false)     codes.push('ACKNOWLEDGMENT_MISSING');

  const hardStop = codes.length > 0;
  if (hardStop) return { status: 'ineligible', reasonCodes: codes };

  // Conditional flags
  const hasFunding = a.hasSnap || a.hasTanf || a.hasReferral || !!a.otherFundingSource;
  if (!hasFunding)                      codes.push('NO_QUALIFYING_FUNDING');
  if (a.hasDiplomaOrGed === false && a.enrolledInGed !== true) codes.push('NO_DIPLOMA_GED_REVIEW');
  if (a.hasDiplomaOrGed === false && a.enrolledInGed === true) codes.push('GED_IN_PROGRESS_REVIEW');
  if (a.pendingCharges === true)        codes.push('PENDING_CHARGES_REVIEW');
  if (a.onProbationParole === true)     codes.push('PROBATION_PAROLE_REVIEW');
  if (a.hasTransportationPlan === false) codes.push('TRANSPORTATION_REVIEW');
  if (a.canMeetPhysical === false)      codes.push('PHYSICAL_READINESS_REVIEW');

  if (codes.length > 0) return { status: 'conditional_review', reasonCodes: codes };

  return { status: 'eligible', reasonCodes: [] };
}

// ── YesNo helper ─────────────────────────────────────────────────────────────
function YesNo({ value, onChange, name }: { value: boolean | null; onChange: (v: boolean) => void; name: string }) {
  return (
    <div className="flex gap-3 mt-1">
      {[true, false].map((v) => (
        <label key={String(v)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${value === v ? (v ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800') : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'}`}>
          <input type="radio" name={name} value={String(v)} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
          {v ? 'Yes' : 'No'}
        </label>
      ))}
    </div>
  );
}

export default function StudentApplicationForm({ initialProgram = '' }: { initialProgram?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applicationType, setApplicationType] = useState<'inquiry' | 'enrollment' | ''>('');
  const [selectedProgram, setSelectedProgram] = useState(initialProgram);
  const [eligibility, setEligibility] = useState<EligibilityAnswers>(EMPTY_ELIGIBILITY);
  const [eligibilityDecision, setEligibilityDecision] = useState<EligibilityDecision | null>(null);
  const [eligibilitySubmitted, setEligibilitySubmitted] = useState(false);

  function setElig<K extends keyof EligibilityAnswers>(key: K, value: EligibilityAnswers[K]) {
    setEligibility(prev => ({ ...prev, [key]: value }));
    setEligibilityDecision(null); // reset decision on change
  }

  function handleEligibilityCheck() {
    const decision = evaluateEligibility(eligibility);
    setEligibilityDecision(decision);
    setEligibilitySubmitted(true);
    if (decision.status === 'ineligible') {
      trackEvent('eligibility_check', 'ineligible', decision.reasonCodes.join(','));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // Honeypot — hidden field bots fill in; silently redirect home
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

    // Block ineligible enrollment submissions
    if (applicationType === 'enrollment') {
      const decision = evaluateEligibility(eligibility);
      if (decision.status === 'ineligible') {
        setError('Your application cannot be submitted because one or more eligibility requirements are not met. Please review the eligibility section above.');
        setLoading(false);
        return;
      }
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
      programInterest: formData.get('programInterest') as string,
      employmentStatus: formData.get('employmentStatus') as string,
      educationLevel: formData.get('educationLevel') as string,
      goals: formData.get('goals') as string,
      applicationType: applicationType as string,
      role: 'student' as const,
      // Eligibility screening
      eligibilityData: applicationType === 'enrollment' ? {
        ...eligibility,
        eligibilityStatus: evaluateEligibility(eligibility).status,
        eligibilityReasonCodes: evaluateEligibility(eligibility).reasonCodes,
        supportNeedsTransport: eligibility.hasTransportationPlan === false,
        supportNeedsOther: eligibility.willingJobReadiness === false,
      } : undefined,
    };

    try {
      trackEvent('form_submit', applicationType === 'inquiry' ? 'inquiry' : 'application', data.programInterest);
      const result = await submitStudentApplication(data);

      if (result.success) {
        trackEvent('application_complete', 'conversion', data.programInterest);

        // Inquiry path or email-only fallback — thank you page, no payment
        if (applicationType === 'inquiry' || result.status === 'email_only') {
          router.push('/apply/inquiry-received');
          return;
        }

        // WorkOne-pending — applicant needs to visit WorkOne before enrollment
        if (result.status === 'pending_workone') {
          router.push('/apply/pending-workone');
          return;
        }

        // Enrollment path — application is submitted and pending review.
        // Redirect to success page; admin reviews and grants LMS access after funding verification.
        router.push(`/apply/success?ref=${encodeURIComponent(result.referenceNumber || '')}&program=${encodeURIComponent(data.programInterest)}&pw=1`);
        return;
      } else {
        setError(
          ('error' in result ? result.error : undefined) ||
          'Something went wrong submitting your application. Please try again or contact us at elevate4humanityedu@gmail.com.'
        );
        setLoading(false);
      }
    } catch {
      setError(
        'The application system is temporarily unavailable. Please email us at elevate4humanityedu@gmail.com with your name, phone, and program interest.'
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot — invisible to real users, bots fill it in */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <label htmlFor="website_url">Website</label>
        <input type="text" id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Step 1 — Application type */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-1">What would you like to do?</h2>
        <p className="text-sm text-black mb-4">Select an option to get started.</p>
        <select
          required
          value={applicationType}
          onChange={e => setApplicationType(e.target.value as 'inquiry' | 'enrollment')}
          className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent bg-white text-sm"
        >
          <option value="">— Select an option —</option>
          <option value="inquiry">I want to learn more / request information (Inquiry)</option>
          <option value="enrollment">I am ready to enroll in a program (Enrollment)</option>
        </select>

        {/* Inquiry info box */}
        {applicationType === 'inquiry' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>Inquiry:</strong> We'll create your account and an advisor will follow up
              with program details, costs, and next steps. No payment is required at this stage.
            </p>
          </div>
        )}

        {/* Enrollment info + waitlist check */}
        {applicationType === 'enrollment' && selectedProgram && WAITLIST_PROGRAMS.has(selectedProgram) && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">This program currently has a waitlist.</p>
            <p className="text-sm text-amber-700 leading-relaxed mb-3">
              New enrollment spots are limited. Join the waitlist and we'll contact you
              as soon as a seat opens.
            </p>
            <Link
              href={`/apply/waitlist/${selectedProgram}`}
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Join the Waitlist →
            </Link>
          </div>
        )}

        {/* Enrollment funding disclosure */}
        {applicationType === 'enrollment' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Important — Enrollment requires payment or verified funding
            </p>
            <p className="text-sm text-amber-700 leading-relaxed">
              Enrollment is not finalized until payment is received or funding is verified.
              If you plan to use <strong>WIOA, WorkOne, EmployIndy, Workforce Ready Grant,
              or any state or federal funding</strong>, you must have written approval from
              your funding agency before enrollment can be completed.{' '}
              <a href="https://www.workone.in.gov" target="_blank" rel="noopener noreferrer"
                 className="underline font-semibold">Find your WorkOne office →</a>
            </p>
          </div>
        )}
      </div>

      {/* Only show the rest of the form once a type is selected */}
      {!applicationType && (
        <div className="text-center py-8 text-black text-sm">
          Select an option above to continue.
        </div>
      )}

      {/* ── ELIGIBILITY & SUPPORT NEEDS SCREENING ── */}
      {applicationType === 'enrollment' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-black mb-1">Eligibility &amp; Support Needs Screening</h2>
            <p className="text-sm text-slate-500">All fields are required. Your answers determine your eligibility status before your application is reviewed.</p>
          </div>

          {/* Hard-stop banner */}
          {eligibilityDecision?.status === 'ineligible' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 text-sm mb-1">You do not currently meet the baseline requirements for this program.</p>
                <p className="text-red-700 text-sm">If you believe this is incorrect or want to discuss alternate options, contact our team before submitting.</p>
                <a href="tel:3173143757" className="inline-block mt-2 text-red-700 font-bold text-sm underline">(317) 314-3757</a>
              </div>
            </div>
          )}

          {/* Conditional banner */}
          {eligibilityDecision?.status === 'conditional_review' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 text-sm mb-1">Your application requires additional review before a decision can be made.</p>
                <p className="text-amber-700 text-sm">A team member may contact you for documentation or clarification. You may still submit your application.</p>
              </div>
            </div>
          )}

          {/* Eligible banner */}
          {eligibilityDecision?.status === 'eligible' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3 items-start">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-800 text-sm mb-1">Your application meets the baseline screening requirements.</p>
                <p className="text-green-700 text-sm">Complete the rest of the form and submit for final review.</p>
              </div>
            </div>
          )}

          {/* 1. Funding & Referral */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">1. Funding &amp; Referral</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Are you currently receiving SNAP (food assistance)?</label>
              <YesNo value={eligibility.hasSnap} onChange={v => setElig('hasSnap', v)} name="hasSnap" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Are you currently receiving TANF?</label>
              <YesNo value={eligibility.hasTanf} onChange={v => setElig('hasTanf', v)} name="hasTanf" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Were you referred by WorkOne, IMPACT, or another workforce partner?</label>
              <YesNo value={eligibility.hasReferral} onChange={v => setElig('hasReferral', v)} name="hasReferral" />
            </div>
            {eligibility.hasReferral && (
              <div className="grid sm:grid-cols-3 gap-3 pl-4 border-l-2 border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Referral source / office</label>
                  <input type="text" value={eligibility.referralSource} onChange={e => setElig('referralSource', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. WorkOne Indianapolis" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Case manager name</label>
                  <input type="text" value={eligibility.caseManagerName} onChange={e => setElig('caseManagerName', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Case manager email</label>
                  <input type="email" value={eligibility.caseManagerEmail} onChange={e => setElig('caseManagerEmail', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
            )}
            {!eligibility.hasSnap && !eligibility.hasTanf && !eligibility.hasReferral && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Other funding source (if any)</label>
                <input type="text" value={eligibility.otherFundingSource} onChange={e => setElig('otherFundingSource', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Workforce Ready Grant, employer sponsor" />
              </div>
            )}
          </div>

          {/* 2. Residency & Age */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">2. Residency &amp; Age</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Are you at least 18 years old?</label>
              <YesNo value={eligibility.isAdult} onChange={v => setElig('isAdult', v)} name="isAdult" />
              {eligibility.isAdult === false && <p className="text-red-600 text-xs mt-1 font-medium">Applicants must be at least 18 years old.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Are you an Indiana resident?</label>
              <YesNo value={eligibility.isIndianaResident} onChange={v => setElig('isIndianaResident', v)} name="isIndianaResident" />
              {eligibility.isIndianaResident === false && <p className="text-red-600 text-xs mt-1 font-medium">Indiana residency is required for this program.</p>}
            </div>
          </div>

          {/* 3. Education */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">3. Education</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Highest level of education completed</label>
              <select value={eligibility.educationLevel} onChange={e => setElig('educationLevel', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="">— Select —</option>
                <option value="no_diploma">No diploma / GED</option>
                <option value="ged">GED / HiSET</option>
                <option value="hs_diploma">High school diploma</option>
                <option value="some_college">Some college or higher</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Do you have a diploma, GED, or HiSET?</label>
              <YesNo value={eligibility.hasDiplomaOrGed} onChange={v => setElig('hasDiplomaOrGed', v)} name="hasDiplomaOrGed" />
            </div>
            {eligibility.hasDiplomaOrGed === false && (
              <div className="pl-4 border-l-2 border-amber-300">
                <label className="block text-sm font-medium text-slate-700 mb-1">Are you actively enrolled in a GED program?</label>
                <YesNo value={eligibility.enrolledInGed} onChange={v => setElig('enrolledInGed', v)} name="enrolledInGed" />
                {eligibility.enrolledInGed === false && <p className="text-amber-700 text-xs mt-1">A diploma, GED, or active GED enrollment is required. Contact us to discuss options.</p>}
              </div>
            )}
          </div>

          {/* 4. Legal */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">4. Legal &amp; Employment Eligibility</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Are you legally authorized to work in the United States?</label>
              <YesNo value={eligibility.workAuthorized} onChange={v => setElig('workAuthorized', v)} name="workAuthorized" />
              {eligibility.workAuthorized === false && <p className="text-red-600 text-xs mt-1 font-medium">Work authorization is required for this program.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Do you have any active warrants?</label>
              <YesNo value={eligibility.activeWarrant} onChange={v => setElig('activeWarrant', v)} name="activeWarrant" />
              {eligibility.activeWarrant === true && <p className="text-red-600 text-xs mt-1 font-medium">Active warrants must be resolved before applying.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Do you have any pending criminal charges?</label>
              <YesNo value={eligibility.pendingCharges} onChange={v => setElig('pendingCharges', v)} name="pendingCharges" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Are you currently on probation or parole?</label>
              <YesNo value={eligibility.onProbationParole} onChange={v => setElig('onProbationParole', v)} name="onProbationParole" />
            </div>
            {(eligibility.pendingCharges || eligibility.onProbationParole) && (
              <div className="pl-4 border-l-2 border-amber-300">
                <label className="block text-sm font-medium text-slate-700 mb-1">Please briefly explain (optional but helpful for review)</label>
                <textarea value={eligibility.legalNotes} onChange={e => setElig('legalNotes', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Your application will be reviewed on a case-by-case basis." />
              </div>
            )}
          </div>

          {/* 5. Program Readiness */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">5. Program Readiness</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Can you attend all required training hours each week?</label>
              <YesNo value={eligibility.canAttendSchedule} onChange={v => setElig('canAttendSchedule', v)} name="canAttendSchedule" />
              {eligibility.canAttendSchedule === false && <p className="text-red-600 text-xs mt-1 font-medium">Consistent attendance is required. Contact us if you have scheduling concerns.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">What days or times are you unavailable? (optional — helps us plan)</label>
              <input type="text" value={eligibility.unavailableTimes} onChange={e => setElig('unavailableTimes', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Monday mornings, Friday afternoons" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Can you stand, move, and safely participate in hands-on training activities?</label>
              <YesNo value={eligibility.canMeetPhysical} onChange={v => setElig('canMeetPhysical', v)} name="canMeetPhysical" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Are you willing to follow attendance, conduct, dress, and safety requirements?</label>
              <YesNo value={eligibility.willingToFollowRules} onChange={v => setElig('willingToFollowRules', v)} name="willingToFollowRules" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Are you willing to participate in job readiness and placement activities?</label>
              <YesNo value={eligibility.willingJobReadiness} onChange={v => setElig('willingJobReadiness', v)} name="willingJobReadiness" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Why are you applying for this program?</label>
              <textarea value={eligibility.motivation} onChange={e => setElig('motivation', e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Tell us what motivated you to apply and what you hope to achieve." />
            </div>
          </div>

          {/* 6. Support Needs */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">6. Support Needs</h3>
            <p className="text-slate-500 text-xs">Disclosing support needs does not disqualify you. It helps us coordinate services that may be available through workforce partners.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Do you currently have a reliable way to get to training?</label>
              <YesNo value={eligibility.hasTransportationPlan} onChange={v => setElig('hasTransportationPlan', v)} name="hasTransportationPlan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Do you need help with childcare, work supplies, or other barriers that could affect attendance?</label>
              <YesNo value={eligibility.willingJobReadiness} onChange={v => setElig('willingJobReadiness', v)} name="otherBarriers" />
            </div>
          </div>

          {/* 7. Acknowledgments */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">7. Acknowledgments</h3>
            <label className="flex gap-3 items-start cursor-pointer">
              <input type="checkbox" checked={eligibility.agreesAttendance} onChange={e => setElig('agreesAttendance', e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-red-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">I understand that this program requires consistent attendance, participation, and completion of all training and employment readiness requirements.</span>
            </label>
            <label className="flex gap-3 items-start cursor-pointer">
              <input type="checkbox" checked={eligibility.agreesVerification} onChange={e => setElig('agreesVerification', e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-red-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">I understand that all information provided will be verified and that submitting this application does not guarantee enrollment.</span>
            </label>
          </div>

          {/* Check eligibility button */}
          <button
            type="button"
            onClick={handleEligibilityCheck}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors text-sm"
          >
            Check My Eligibility
          </button>
        </div>
      )}

      {/* Personal Information — shown for both paths */}
      {applicationType && (<>
      {/* Personal Information */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-black mb-2"
            >
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-black mb-2"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black mb-2"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-black mb-2"
            >
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-black mb-2"
            >
              Create Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-black mb-2"
            >
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={8}
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-black mb-2"
            >
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">Address</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-black mb-2"
            >
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-black mb-2"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-black mb-2"
              >
                State
              </label>
              <select
                id="state"
                name="state"
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                <option value="IN">Indiana</option>
                <option value="IL">Illinois</option>
                <option value="OH">Ohio</option>
                <option value="KY">Kentucky</option>
                <option value="MI">Michigan</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium text-black mb-2"
              >
                ZIP Code
              </label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Program Interest */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Program Interest
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="programInterest"
              className="block text-sm font-medium text-black mb-2"
            >
              Which program interests you?
            </label>
            <select
              id="programInterest"
              name="programInterest"
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select a program</option>
              {programGroups.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.programs.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </optgroup>
              ))}
              <option value="not-sure">Not Sure Yet</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="employmentStatus"
              className="block text-sm font-medium text-black mb-2"
            >
              Current Employment Status
            </label>
            <select
              id="employmentStatus"
              name="employmentStatus"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select status</option>
              <option value="unemployed">Unemployed</option>
              <option value="part-time">Part-time Employed</option>
              <option value="full-time">Full-time Employed</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="educationLevel"
              className="block text-sm font-medium text-black mb-2"
            >
              Highest Education Level
            </label>
            <select
              id="educationLevel"
              name="educationLevel"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
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
            <label
              htmlFor="goals"
              className="block text-sm font-medium text-black mb-2"
            >
              What are your career goals?
            </label>
            <textarea
              id="goals"
              name="goals"
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="Tell us about your career aspirations..."
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading || !applicationType}
          className="flex-1 min-h-[48px] px-6 py-3 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? 'Submitting...'
            : applicationType === 'inquiry'
              ? 'Submit Inquiry'
              : 'Continue to Enrollment →'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-[48px] px-6 py-3 bg-white border-2 border-slate-300 text-black font-semibold rounded-lg hover:border-slate-400 transition-colors"
        >
          Back
        </button>
      </div>
      </>)}
    </form>
  );
}
