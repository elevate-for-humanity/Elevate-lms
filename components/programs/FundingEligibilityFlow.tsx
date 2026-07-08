'use client';

/**
 * FundingEligibilityFlow
 *
 * Step 1 — Indiana resident check (all state funding requires residency)
 * Step 2 — Agency process check (WorkOne / ICC / FSSA)
 * Step 3a — Already approved → ready to submit
 * Step 3b — In process → submit, we'll coordinate
 * Step 3c — Not started → ICC appointment link + step-by-step instructions
 * Step 3d — Not Indiana resident → self-pay options + contact info
 */

import { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Phone,
  Clock,
  CreditCard,
  ArrowRight,
  Home,
} from 'lucide-react';
import { BNPL_PROVIDER_SUMMARY } from '@/lib/bnpl-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type FundingType = 'wioa' | 'wrg' | 'fssa';

export type EligibilityStatus = 'approved' | 'in_process' | 'needs_appointment' | 'not_resident';

export type FundingEligibilityProgram = 'hvac' | 'barber';

interface Props {
  fundingType: FundingType;
  onReady: (status: EligibilityStatus) => void;
  /** ICC search label and WRG/FSSA copy (default: HVAC) */
  program?: FundingEligibilityProgram;
}

const CFG = {
  wioa: {
    name: 'WIOA (Workforce Innovation and Opportunity Act)',
    agencyShort: 'WorkOne',
    iccRequired: true,
    iccUrl: 'https://www.indianacareerconnect.com',
    appointmentUrl: 'https://www.in.gov/dwd/find-a-workone-center/',
    phone: '1-800-891-6499',
    timeEstimate: '2–4 weeks',
    note: 'WIOA covers full tuition, books, and exam fees. You must receive an Individual Training Account (ITA) from WorkOne before enrolling.',
    steps: [
      'Go to IndianaCareerConnect.com and create a free account',
      'Complete your profile — work history, education, and goals',
      'Upload your resume (even a basic one is fine)',
      'Schedule an appointment at your nearest WorkOne center',
      'Meet with a career advisor — they determine WIOA eligibility',
      'Receive your Individual Training Account (ITA) letter if approved',
      'Bring your ITA to Elevate — we handle the rest',
    ],
    eligibility: [
      'Indiana resident',
      'Unemployed, underemployed, or at risk of layoff',
      'Meet income guidelines (varies by household size)',
      'US citizen or eligible non-citizen',
    ],
  },
  wrg: {
    name: 'Workforce Ready Grant / Next Level Jobs',
    agencyShort: 'Indiana Career Connect',
    iccRequired: true,
    iccUrl: 'https://www.indianacareerconnect.com',
    appointmentUrl: 'https://www.in.gov/che/next-level-jobs/',
    phone: '1-888-544-4849',
    timeEstimate: '5–10 business days',
    note: 'The Workforce Ready Grant covers full tuition for approved programs. HVAC is on the approved list. Apply entirely online — no in-person visit required.',
    steps: [
      'Go to IndianaCareerConnect.com and create a free account',
      `Search for "HVAC" and select ${PLATFORM_DEFAULTS.orgName} as your provider`,
      'Complete the Workforce Ready Grant application online',
      'Receive approval notification (typically 5–10 business days)',
      'Bring your WRG approval letter to Elevate for enrollment',
    ],
    eligibility: [
      'Indiana resident',
      'US citizen or eligible non-citizen',
      'Not currently enrolled in a degree-granting program',
      'Program must be on the WRG approved list (HVAC ✓)',
    ],
  },
  fssa: {
    name: 'FSSA IMPACT',
    agencyShort: 'FSSA / DFR',
    iccRequired: false,
    iccUrl: '',
    appointmentUrl: '',
    phone: '1-800-403-0864',
    timeEstimate: '1–3 weeks',
    note: 'FSSA IMPACT is for current SNAP or TANF recipients. You must be referred by your FSSA case worker — you cannot self-apply.',
    steps: [
      'Contact your FSSA/DFR case worker and request an IMPACT training referral',
      'Your case worker assesses your eligibility for training support',
      'If approved, your case worker issues a training authorization letter',
      'Bring your FSSA training authorization to Elevate — we handle enrollment',
    ],
    eligibility: [
      'Indiana resident',
      'Current SNAP or TANF recipient',
      'Referred by your FSSA case worker',
      'Program approved by FSSA (HVAC ✓)',
    ],
  },
} as const;

const SELF_PAY_OPTIONS = [
  { label: '20% deposit + weekly payments', detail: '$1,000 down today, then as low as $200/week' },
  { label: 'Pay in full', detail: '$5,000 one-time — start immediately' },
  { label: 'BNPL monthly installments', detail: `Providers: ${BNPL_PROVIDER_SUMMARY}` },
  { label: 'BNPL pay-over-time options', detail: 'Provider terms and eligibility shown at checkout' },
  { label: 'Employer sponsorship', detail: 'OJT wage reimbursement or apprenticeship agreement' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function FundingEligibilityFlow({ fundingType, onReady }: Props) {
  const cfg = CFG[fundingType];
  const [isResident, setIsResident] = useState<boolean | null>(null);
  const [agencyStatus, setAgencyStatus] = useState<
    'approved' | 'in_process' | 'not_started' | null
  >(null);
  const [stepsOpen, setStepsOpen] = useState(true);
  const [eligOpen, setEligOpen] = useState(false);
  const [selfPayOpen, setSelfPayOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function confirm(status: EligibilityStatus) {
    setConfirmed(true);
    onReady(status);
  }

  function handleResidencyChange(v: boolean) {
    setIsResident(v);
    setAgencyStatus(null);
    setConfirmed(false);
  }

  function handleAgencyChange(v: 'approved' | 'in_process' | 'not_started') {
    setAgencyStatus(v);
    setConfirmed(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-brand-blue-700 px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-200">
          Funding Selected
        </p>
        <p className="text-white font-bold text-sm mt-0.5">{cfg.name}</p>
      </div>

      <div className="p-5 space-y-6">
        {/* ── STEP 1: Residency ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-4 h-4 text-brand-blue-600" />
            <p className="text-sm font-bold text-slate-800">Are you an Indiana resident?</p>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            WIOA, Workforce Ready Grant, and FSSA are Indiana state programs — residency is
            required.
          </p>
          <div className="flex gap-3">
            {(
              [
                { label: 'Yes — I live in Indiana', value: true },
                { label: 'No — I live outside Indiana', value: false },
              ] as const
            ).map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => handleResidencyChange(opt.value)}
                className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  isResident === opt.value
                    ? opt.value
                      ? 'border-brand-green-500 bg-brand-green-50 text-brand-green-800'
                      : 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── NOT A RESIDENT ── */}
        {isResident === false && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Indiana residency required for state funding
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  WIOA, Workforce Ready Grant, and FSSA are only available to Indiana residents. If
                  you recently moved or plan to relocate, call us — we can help determine
                  eligibility.
                </p>
              </div>
            </div>

            {/* Self-pay options */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setSelfPayOpen((o) => !o)}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-slate-800">
                  Self-pay options — available to everyone, no residency required
                </p>
                {selfPayOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {selfPayOpen && (
                <ul className="px-4 pb-4 space-y-2">
                  {SELF_PAY_OPTIONS.map((o) => (
                    <li key={o.label} className="flex items-start gap-2 text-sm text-slate-600">
                      <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>{o.label}</strong> — {o.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
              <p className="font-bold text-slate-800 mb-2">
                Questions? Our enrollment team can help.
              </p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <a
                  href="tel:${PLATFORM_DEFAULTS.supportPhone}"
                  className="text-brand-blue-600 font-semibold hover:underline"
                >
                  ${PLATFORM_DEFAULTS.supportPhone}
                </a>
              </div>
            </div>

            <button
              onClick={() => confirm('not_resident')}
              disabled={confirmed}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${
                confirmed ? 'bg-brand-green-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {confirmed ? (
                '✓ Confirmed'
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Continue with Self-Pay Options{' '}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STEP 2: Agency process (Indiana residents only) ── */}
        {isResident === true && (
          <div>
            <p className="text-sm font-bold text-slate-800 mb-3">
              Have you already been through {cfg.agencyShort}?
            </p>
            <div className="space-y-2">
              {[
                {
                  value: 'approved' as const,
                  label: 'Yes — I have my approval / authorization letter',
                  sub: 'ITA, WRG approval, or FSSA training authorization in hand',
                  active: 'border-brand-green-500 bg-brand-green-50',
                },
                {
                  value: 'in_process' as const,
                  label: `I'm currently in the ${cfg.agencyShort} process`,
                  sub: 'Appointment scheduled or application under review',
                  active: 'border-brand-blue-500 bg-brand-blue-50',
                },
                {
                  value: 'not_started' as const,
                  label: `No — I have not contacted ${cfg.agencyShort} yet`,
                  sub: 'I need to start the process before I can use this funding',
                  active: 'border-amber-500 bg-amber-50',
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    agencyStatus === opt.value
                      ? opt.active
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="agencyStatus"
                    value={opt.value}
                    checked={agencyStatus === opt.value}
                    onChange={() => handleAgencyChange(opt.value)}
                    className="mt-0.5 w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── APPROVED ── */}
        {isResident === true && agencyStatus === 'approved' && (
          <div className="space-y-3">
            <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-brand-green-800">You're ready to apply</p>
                <p className="text-sm text-brand-green-700 mt-1">
                  Our enrollment team will contact you within 2 business days to collect your
                  authorization letter and complete your enrollment.
                </p>
              </div>
            </div>
            <button
              onClick={() => confirm('approved')}
              disabled={confirmed}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                confirmed
                  ? 'bg-brand-green-600 text-white'
                  : 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
              }`}
            >
              {confirmed ? '✓ Confirmed — scroll down to submit' : 'Continue to Application →'}
            </button>
          </div>
        )}

        {/* ── IN PROCESS ── */}
        {isResident === true && agencyStatus === 'in_process' && (
          <div className="space-y-3">
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-brand-blue-800">
                  Submit now — we'll hold your spot
                </p>
                <p className="text-sm text-brand-blue-700 mt-1">
                  We'll coordinate with you once your approval comes through. No payment required
                  until funding is confirmed.
                </p>
              </div>
            </div>
            <button
              onClick={() => confirm('in_process')}
              disabled={confirmed}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                confirmed
                  ? 'bg-brand-green-600 text-white'
                  : 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
              }`}
            >
              {confirmed ? '✓ Confirmed — scroll down to submit' : 'Continue to Application →'}
            </button>
          </div>
        )}

        {/* ── NOT STARTED — full appointment flow ── */}
        {isResident === true && agencyStatus === 'not_started' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  You need to contact {cfg.agencyShort} before enrolling with this funding
                </p>
                <p className="text-sm text-amber-700 mt-1">{cfg.note}</p>
              </div>
            </div>

            {/* Primary CTA — ICC / agency */}
            <div className="bg-brand-blue-700 rounded-xl p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-200 mb-1">
                Start Here
              </p>
              <p className="font-bold text-base mb-1">
                {cfg.iccRequired ? 'Go to Indiana Career Connect' : `Contact ${cfg.agencyShort}`}
              </p>
              <p className="text-sm text-brand-blue-200 mb-4">
                {cfg.iccRequired
                  ? 'Create your free account, complete your profile, and schedule your WorkOne appointment — all in one place.'
                  : 'Contact your FSSA/DFR case worker to request an IMPACT training referral.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={cfg.iccUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white text-brand-blue-700 font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-blue-50 transition-colors"
                >
                  {cfg.iccRequired
                    ? 'Open Indiana Career Connect'
                    : `Open ${cfg.agencyShort} Website`}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {cfg.iccRequired && (
                  <a
                    href={cfg.appointmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border border-white/40 text-slate-900 font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Find a WorkOne Center
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-sm text-brand-blue-200">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Call {cfg.agencyShort}: <strong className="text-white">{cfg.phone}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-blue-200">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Typical approval time:{' '}
                    <strong className="text-white">{cfg.timeEstimate}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Step-by-step */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setStepsOpen((o) => !o)}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-slate-800">
                  Step-by-step: how to get approved
                </p>
                {stepsOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {stepsOpen && (
                <ol className="px-4 pb-4 space-y-3">
                  {cfg.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-6 h-6 rounded-full bg-brand-blue-100 text-brand-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Eligibility requirements */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setEligOpen((o) => !o)}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-slate-800">Basic eligibility requirements</p>
                {eligOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {eligOpen && (
                <ul className="px-4 pb-4 space-y-2">
                  {cfg.eligibility.map((e) => (
                    <li key={e} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Self-pay fallback */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-800 mb-2">
                Don't want to wait? Self-pay options are available right now.
              </p>
              <ul className="space-y-1.5 mb-3">
                {SELF_PAY_OPTIONS.slice(0, 3).map((o) => (
                  <li key={o.label} className="flex items-start gap-2 text-xs text-slate-600">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>{o.label}</strong> — {o.detail}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500">
                Select "Self-pay" above to see all payment options, or call us at{' '}
                <a
                  href="tel:${PLATFORM_DEFAULTS.supportPhone}"
                  className="text-brand-blue-600 font-semibold hover:underline"
                >
                  ${PLATFORM_DEFAULTS.supportPhone}
                </a>
                .
              </p>
            </div>

            {/* Submit anyway — team will help */}
            <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-4">
              <p className="text-sm font-bold text-brand-green-800 mb-1">
                Want us to help you get started?
              </p>
              <p className="text-sm text-brand-green-700">
                Submit your application now and our enrollment team will contact you within 2
                business days to walk you through the {cfg.agencyShort} process and help you
                schedule your appointment.
              </p>
            </div>

            <button
              onClick={() => confirm('needs_appointment')}
              disabled={confirmed}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                confirmed
                  ? 'bg-brand-green-600 text-white'
                  : 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
              }`}
            >
              {confirmed
                ? '✓ Confirmed — scroll down to submit'
                : 'Submit Application — Team Will Help Me Get Approved →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
