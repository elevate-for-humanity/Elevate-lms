'use client';

/**
 * ProgramFundingGate
 *
 * Pre-selection questionnaire shown before a learner picks a funding path.
 * Handles programs with mixed funding (e.g. cosmetology, esthetician) or routes
 * barber WIOA/WRG to the apprentice application when `routeFundedToEnrollment` is set.
 * Legacy: programs that are NOT WIOA/WRG eligible (e.g. nail
 * esthetician, nail) — routes to FSSA/IMPACT, employer-paid, or self-pay.
 *
 * Flow:
 *   Step 1 — Indiana resident? (all state funding requires residency)
 *   Step 2 (Indiana) — Which funding situation applies?
 *     a) SNAP/TANF recipient →  path
 *     b) Employer sponsor → employer-paid path
 *     c) Neither → self-pay
 *   Step 2 (non-Indiana) — Self-pay only, with explanation
 *
 * Props:
 *   programName   — Display name of the program
 *   applyHref     — Where the "Apply Now" CTA links
 *   selfPayCost   — Full program cost string (e.g. "$4,980")
 *   depositAmount — Deposit amount string (e.g. "$1,743")
 *   depositHref   — Stripe deposit checkout URL
 *   fullPayHref   — Stripe full-pay checkout URL
 *   onFundingSelected — Optional callback when a path is confirmed
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Phone,
  ExternalLink,
  Users,
  Heart,
  Building2,
} from 'lucide-react';
import { BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type FundingPath = 'fssa' | 'employer' | 'self_pay' | 'self_pay_out_of_state';

interface Props {
  programName: string;
  applyHref: string;
  selfPayCost: string;
  depositAmount: string;
  depositHref: string;
  fullPayHref: string;
  onFundingSelected?: (path: FundingPath) => void;
}

export default function ProgramFundingGate({
  programName,
  applyHref,
  selfPayCost,
  depositAmount,
  depositHref,
  fullPayHref,
  onFundingSelected,
}: Props) {
  const [isResident, setIsResident] = useState<boolean | null>(null);
  const [fundingPath, setFundingPath] = useState<FundingPath | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function selectResident(v: boolean) {
    setIsResident(v);
    setFundingPath(null);
    setConfirmed(false);
  }

  function selectPath(path: FundingPath) {
    setFundingPath(path);
    setConfirmed(false);
  }

  function confirm(path: FundingPath) {
    setConfirmed(true);
    onFundingSelected?.(path);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-slate-900 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
          Funding &amp; Enrollment
        </p>
        <p className="text-white font-bold text-base">{programName}</p>
      </div>

      <div className="p-5 space-y-6">
        {/* ── STEP 1: Indiana residency ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-slate-500" />
            <p className="text-sm font-bold text-slate-800">Do you live in Indiana?</p>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Some funding options are only available to Indiana residents.
          </p>
          <div className="flex gap-3">
            {(
              [
                { label: 'Yes — I live in Indiana', value: true },
                { label: 'No — outside Indiana', value: false },
              ] as const
            ).map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => selectResident(opt.value)}
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

        {/* ── NON-INDIANA: self-pay only ── */}
        {isResident === false && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Indiana state funding requires Indiana residency
                </p>
                <p className="text-sm text-amber-700 mt-1">
                   and employer apprenticeship funding are Indiana programs. If you live
                  outside Indiana, self-pay enrollment is available immediately — no waiting on
                  approvals.
                </p>
              </div>
            </div>

            <SelfPayOptions
              selfPayCost={selfPayCost}
              depositAmount={depositAmount}
              depositHref={depositHref}
              fullPayHref={fullPayHref}
              applyHref={applyHref}
              outOfState
              confirmed={confirmed && fundingPath === 'self_pay_out_of_state'}
              onConfirm={() => {
                selectPath('self_pay_out_of_state');
                confirm('self_pay_out_of_state');
              }}
            />
          </div>
        )}

        {/* ── INDIANA: funding path selector ── */}
        {isResident === true && (
          <div>
            <p className="text-sm font-bold text-slate-800 mb-3">
              Which situation best describes you?
            </p>
            <div className="space-y-2">
              {[
                {
                  path: 'fssa' as FundingPath,
                  icon: <Heart className="w-5 h-5 text-purple-600" />,
                  label: 'I receive SNAP or TANF benefits',
                  sub: 'You may qualify for  — free training funded by your case worker',
                  activeCls: 'border-purple-500 bg-purple-50',
                },
                {
                  path: 'employer' as FundingPath,
                  icon: <Building2 className="w-5 h-5 text-blue-600" />,
                  label: 'I have an employer sponsor / host shop',
                  sub: 'Apprenticeship agreement — employer covers tuition through OJT wages',
                  activeCls: 'border-blue-500 bg-blue-50',
                },
                {
                  path: 'self_pay' as FundingPath,
                  icon: <CreditCard className="w-5 h-5 text-slate-600" />,
                  label: 'I will pay out of pocket',
                  sub: `Deposit + weekly payments, or pay in full (${selfPayCost}). BNPL available at checkout.`,
                  activeCls: 'border-slate-500 bg-slate-50',
                },
              ].map((opt) => (
                <label
                  key={opt.path}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    fundingPath === opt.path
                      ? opt.activeCls
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="fundingPath"
                    value={opt.path}
                    checked={fundingPath === opt.path}
                    onChange={() => selectPath(opt.path)}
                    className="mt-0.5 w-4 h-4 sr-only"
                  />
                  <div className="flex-shrink-0 mt-0.5">{opt.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ──  path ── */}
        {isResident === true && fundingPath === 'fssa' && (
          <FssaPath
            confirmed={confirmed}
            onConfirm={() => confirm('fssa')}
            applyHref={applyHref}
          />
        )}

        {/* ── Employer-paid path ── */}
        {isResident === true && fundingPath === 'employer' && (
          <EmployerPath
            confirmed={confirmed}
            onConfirm={() => confirm('employer')}
            applyHref={applyHref}
          />
        )}

        {/* ── Self-pay (Indiana) ── */}
        {isResident === true && fundingPath === 'self_pay' && (
          <SelfPayOptions
            selfPayCost={selfPayCost}
            depositAmount={depositAmount}
            depositHref={depositHref}
            fullPayHref={fullPayHref}
            applyHref={applyHref}
            outOfState={false}
            confirmed={confirmed && fundingPath === 'self_pay'}
            onConfirm={() => confirm('self_pay')}
          />
        )}
      </div>
    </div>
  );
}

// ──  sub-panel ─────────────────────────────────────────────────────

function FssaPath({
  confirmed,
  onConfirm,
  applyHref,
}: {
  confirmed: boolean;
  onConfirm: () => void;
  applyHref: string;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-purple-900"> — Free Training</p>
            <p className="text-sm text-purple-800 mt-1">
              Indiana&rsquo;s SNAP Employment &amp; Training (IMPACT) program can cover 100% of
              tuition for eligible recipients. You must be referred by your FSSA/DFR case worker —
              you cannot self-apply.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-bold text-slate-800">How to get started:</p>
        <ol className="space-y-2">
          {[
            'Contact your FSSA/DFR case worker and request an IMPACT training referral',
            'Your case worker assesses your eligibility and the program',
            'If approved, they issue a training authorization letter',
            'Bring your authorization to Elevate — we handle enrollment from there',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="pt-2 border-t border-slate-100 space-y-1">
          <p className="flex items-center gap-2 text-sm text-purple-700 font-medium">
            FSSA Division of Family Resources — contact your case worker
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <a href="tel:18004030864" className="hover:text-purple-700">
              1-800-403-0864
            </a>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Already have your FSSA authorization letter?{' '}
        <Link href={applyHref} className="text-purple-700 font-medium hover:underline">
          Apply now →
        </Link>
      </p>

      <button
        onClick={onConfirm}
        disabled={confirmed}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${
          confirmed
            ? 'bg-brand-green-600 text-white'
            : 'bg-purple-700 hover:bg-purple-800 text-white'
        }`}
      >
        {confirmed ? (
          '✓ Confirmed — scroll down to apply'
        ) : (
          <>
            I understand — I&rsquo;ll contact my case worker
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

// ── Employer-paid sub-panel ───────────────────────────────────────────────────

function EmployerPath({
  confirmed,
  onConfirm,
  applyHref,
}: {
  confirmed: boolean;
  onConfirm: () => void;
  applyHref: string;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-900">Employer / Apprenticeship Sponsor</p>
            <p className="text-sm text-blue-800 mt-1">
              If a licensed shop has agreed to sponsor your apprenticeship, they can cover tuition
              through an OJT wage reimbursement or apprenticeship agreement. No out-of-pocket cost
              to you.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-bold text-slate-800">Next steps:</p>
        <ol className="space-y-2">
          {[
            'Confirm your host shop / employer sponsor is willing to sign an apprenticeship agreement',
            'Apply below — select "I have a host shop" on the application',
            'Our team contacts your employer to set up the agreement',
            'Enrollment is confirmed once the agreement is signed',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <button
        onClick={onConfirm}
        disabled={confirmed}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${
          confirmed
            ? 'bg-brand-green-600 text-white'
            : 'bg-blue-700 hover:bg-blue-800 text-white'
        }`}
      >
        {confirmed ? (
          '✓ Confirmed — scroll down to apply'
        ) : (
          <>
            Continue to Application
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {confirmed && (
        <Link
          href={`${applyHref}?type=partner_shop`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Apply with Employer Sponsor
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// ── Self-pay sub-panel ────────────────────────────────────────────────────────

function SelfPayOptions({
  selfPayCost,
  depositAmount,
  depositHref,
  fullPayHref,
  applyHref,
  outOfState,
  confirmed,
  onConfirm,
}: {
  selfPayCost: string;
  depositAmount: string;
  depositHref: string;
  fullPayHref: string;
  applyHref: string;
  outOfState: boolean;
  confirmed: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {/* Deposit + weekly */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Deposit + Weekly Payments
          </p>
          <p className="text-2xl font-extrabold text-slate-900">{depositAmount}</p>
          <p className="text-xs text-slate-500 mb-3">deposit today, then weekly payments</p>
          <a
            href={depositHref}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Pay Deposit
          </a>
        </div>

        {/* Pay in full */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Pay in Full
          </p>
          <p className="text-2xl font-extrabold text-slate-900">{selfPayCost}</p>
          <p className="text-xs text-slate-500 mb-3">one-time · BNPL options available</p>
          <a
            href={fullPayHref}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-brand-red-600 text-white text-sm font-bold hover:bg-brand-red-700 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Pay in Full
          </a>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center">
        {BNPL_PROVIDER_NAMES} accepted at checkout
      </p>

      {outOfState && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
          <p className="font-bold text-slate-800 mb-1">Questions?</p>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`}
              className="hover:text-blue-600"
            >
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      )}

      {!outOfState && (
        <button
          onClick={onConfirm}
          disabled={confirmed}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${
            confirmed
              ? 'bg-brand-green-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {confirmed ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Confirmed — use the buttons above to pay
            </>
          ) : (
            <>
              I&rsquo;ll pay out of pocket
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      <p className="text-xs text-slate-500 text-center">
        Or{' '}
        <Link href={applyHref} className="text-blue-600 hover:underline">
          submit an application first
        </Link>{' '}
        and pay later.
      </p>
    </div>
  );
}
