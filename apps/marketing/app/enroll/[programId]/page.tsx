'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Key, CheckCircle, AlertCircle, ArrowRight, Tag } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import { getInitialProgramInvoiceCents } from '@/lib/programs/deposit-policy';
import ProgramDepositCalculator from '@/components/programs/ProgramDepositCalculator';
import { downPaymentCents, programInstallmentTerms } from '@/lib/programs/installment-terms';

function getClientSearchParam(name: string) {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

interface Program {
  id: string;
  name: string;
  slug?: string;
  description: string;
  duration_weeks: number;
  requires_license: boolean;
  is_free: boolean;
  price: number | null;
  total_cost: number | null;
  funding_eligible: boolean;
  category?: string;
}

export default function EnrollPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  const onlineSchoolProgram = ['healthcare-training', 'enchanted-hearts'].includes(
    getClientSearchParam('partner') || '',
  );

  const [program, setProgram] = useState<Program | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'quickbooks' | 'affirm'>('quickbooks');
  const [message, setMessage] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [downPayment, setDownPayment] = useState(() => getClientSearchParam('down_payment') || '600');
  const [couponCode, setCouponCode] = useState(
    () => getClientSearchParam('coupon')?.toUpperCase() || '',
  );
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'installments'>(() =>
    getClientSearchParam('payment_plan') === 'full' ? 'full' : 'installments',
  );
  const [eligibility, setEligibility] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    loadProgram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const loadProgram = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/enroll/program/${encodeURIComponent(programId)}`);
      const result = await response.json();
      if (!response.ok || !result.program)
        throw new Error(result.error || 'Unable to load program.');
      const data = result.program;

      setProgram(data);
      if (!/apprentice/i.test(data.slug || '') && !getClientSearchParam('payment_plan')) setPaymentPlan('full');

      await checkEligibility(data.id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!program?.slug || onlineSchoolProgram) return;
    const response = await fetch(`/api/programs/enroll/payment-status?program=${encodeURIComponent(program.slug)}`, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) {
      if (response.status !== 401) setMessage(result.error || 'Unable to verify payment.');
      return;
    }
    if (result.paid && result.application_url) window.location.assign(result.application_url);
  };

  useEffect(() => {
    if (!program?.slug || onlineSchoolProgram) return;
    void verifyPayment();
    const timer = window.setInterval(() => { void verifyPayment(); }, 15000);
    const onReturn = () => { void verifyPayment(); };
    window.addEventListener('pageshow', onReturn);
    return () => { window.clearInterval(timer); window.removeEventListener('pageshow', onReturn); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.slug, onlineSchoolProgram]);

  const checkEligibility = async (resolvedProgramId?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('can_user_enroll', {
        p_user_id: user.id,
        p_program_id: resolvedProgramId ?? program?.id ?? programId,
        p_license_key: licenseKey || null,
      });

      if (error) throw error;
      setEligibility(data);
    } catch (error) {
      /* Error handled silently */
      logger.error('Eligibility check error:', error);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    setMessage('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Please sign in to enroll');
        const query = new URLSearchParams(window.location.search);
        query.set('payment_plan', paymentPlan);
        query.set('down_payment', downPayment);
        if (couponCode.trim()) query.set('coupon', couponCode.trim());
        const destination = `/enroll/${programId}?${query.toString()}`;
        router.push(`/login?redirect=${encodeURIComponent(destination)}`);
        return;
      }

      if (program?.requires_license && !licenseKey) {
        setMessage('This program requires a license key');
        setEnrolling(false);
        return;
      }

      // Programs are free if: is_free=true OR funding_eligible (WIOA/WRG covers cost)
      const isFreeProgram = program?.is_free === true;
      const isPaid = !isFreeProgram && (program?.price || program?.total_cost);

      if (isPaid) {
        const customDownPayment = !onlineSchoolProgram && paymentMethod === 'quickbooks' && paymentPlan === 'installments' && /apprentice/i.test(program?.slug || '')
          ? downPaymentCents(downPayment) : undefined;
        if (customDownPayment !== undefined) programInstallmentTerms(program!.slug!, Math.round(Number(program!.price ?? program!.total_cost) * 100), customDownPayment);
        // Use canonical program enrollment checkout
        const response = await fetch('/api/programs/enroll/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_id: program?.id || programId,
            funding_source: 'self_pay',
            payment_method: paymentMethod,
            payment_plan: onlineSchoolProgram || paymentMethod === 'affirm' ? 'full' : paymentPlan,
            down_payment_cents: customDownPayment,
            coupon_code: onlineSchoolProgram ? undefined : couponCode.trim() || undefined,
            partner_key: getClientSearchParam('partner') || undefined,
            require_full_application: !onlineSchoolProgram,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to start checkout');
        }

        if (data.url) {
          setPaymentUrl(data.url);
          setMessage('Opening secure checkout. After payment, return here to continue your full enrollment application.');
          window.location.assign(data.url);
          return;
        }
      } else {
        // Funded enrollment - still use canonical checkout with funding_source
        const fundingSource = program?.funding_eligible ? 'wioa' : 'self_pay';
        const response = await fetch('/api/programs/enroll/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_id: program?.id || programId,
            funding_source: fundingSource,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Enrollment could not be completed. Please contact Elevate.',
          );
        }

        if (data.url) {
          if (onlineSchoolProgram) window.location.href = data.url;
          else {
            setPaymentUrl(data.url);
            setMessage('Secure checkout is ready. Pay using the link below, then return here to verify payment and complete your full enrollment application.');
          }
          return;
        }

        throw new Error(
          data.error ||
            'Enrollment checkout did not return a redirect URL. Please try again or contact support.',
        );
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-slate-600">Loading program details...</p>
          <span className="sr-only">Loading program information, please wait</span>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Program Not Found</h2>
          <p className="text-slate-600">The program you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Enroll', href: '/enroll' }, { label: program?.name || 'Program' }]}
          />
        </div>
      </div>

      <div className="py-4 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-slate-700 px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12" />
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold">Full Enrollment Application — {program.name}</h1>
                    {program.is_free === true ? (
                      <span className="px-3 py-1 bg-brand-green-500 text-white text-sm font-bold rounded-full">
                        FREE
                      </span>
                    ) : program.funding_eligible ? (
                      <span className="px-3 py-1 bg-brand-green-500 text-white text-sm font-bold rounded-full">
                        FREE with WIOA/WRG
                      </span>
                    ) : program.price || program.total_cost ? (
                      <span className="px-3 py-1 bg-white/20 text-slate-900 text-sm font-bold rounded-full">
                        ${(program.price || program.total_cost || 0).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-blue-100 mt-1 text-sm sm:text-base">
                    Duration: {program.duration_weeks} weeks
                  </p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-blue-50">{program.description}</p>
              {program.funding_eligible && (program.price || program.total_cost) && (
                <p className="text-sm text-blue-200 mt-2">
                  Self-pay option: ${(program.price || program.total_cost || 0).toLocaleString()}
                </p>
              )}
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              {!onlineSchoolProgram && <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
                <h2 className="text-xl font-bold">Payment is required before the full application</h2>
                <p className="mt-2">1. Pay the required deposit or tuition. 2. Complete and submit your full enrollment application. 3. Your enrollment and dashboard activate automatically after payment verification and submission. Orientation, documents, and any required Host Shop placement still apply before training starts.</p>
                <a className="mt-3 inline-block font-bold underline" href={`/apply/student?program=${encodeURIComponent(program.slug || programId)}&intent=inquiry`}>Only requesting information? Use the Intake Application.</a>
              </div>}
              {paymentUrl && <div className="mb-6 rounded-xl border border-green-300 p-5">
                <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="block font-bold underline">Open secure payment checkout</a>
                <button type="button" onClick={() => void verifyPayment()} className="mt-4 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">I have paid — verify and continue</button>
                <p className="mt-2 text-sm">The full application opens only after the payment provider confirms payment. No separate invoice request is needed.</p>
              </div>}
              {message && (
                <div
                  className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-start gap-2 sm:gap-3 text-sm sm:text-base ${
                    message.includes('Error')
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : message.includes('successful')
                        ? 'bg-brand-green-50 text-brand-green-800 border border-brand-green-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {message.includes('Error') ? (
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              {eligibility && !eligibility.can_enroll && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 text-sm sm:text-base">
                      Cannot Enroll
                    </p>
                    <p className="text-yellow-800 text-xs sm:text-sm mt-1">{eligibility.reason}</p>
                  </div>
                </div>
              )}

              {program.requires_license && (
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    License Key *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => {
                        setLicenseKey(e.target.value);
                        if (e.target.value) checkEligibility(program.id);
                      }}
                      placeholder="Enter your license key"
                      className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500">
                    This program requires a valid license key to enroll
                  </p>
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-base sm:text-lg">
                  What You'll Get:
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm sm:text-base">
                      Full access to course materials
                    </span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm sm:text-base">
                      Interactive lessons and assessments
                    </span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm sm:text-base">
                      Certificate upon completion
                    </span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm sm:text-base">Instructor support</span>
                  </li>
                </ul>
              </div>

              {!program.is_free && (program.price || program.total_cost) ? (
                <>
                  <fieldset className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
                    <legend className="px-1 font-black text-slate-950">
                      How would you like to pay?
                    </legend>
                    <label className="mt-3 flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        value="quickbooks"
                        checked={paymentMethod === 'quickbooks'}
                        onChange={() => setPaymentMethod('quickbooks')}
                      />{' '}
                      Pay online through QuickBooks
                    </label>
                    <label className="mt-3 flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        value="affirm"
                        checked={paymentMethod === 'affirm'}
                        onChange={() => setPaymentMethod('affirm')}
                      />{' '}
                      Apply for Affirm Buy Now, Pay Later
                    </label>
                    <p className="mt-3 text-sm text-slate-600">
                      Affirm approval and repayment terms are determined by Affirm. Your payment is
                      recorded against your Elevate QuickBooks invoice.
                    </p>
                  </fieldset>
                  {!onlineSchoolProgram && paymentMethod !== 'affirm' ? (
                    <fieldset className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:mb-6">
                      <legend className="px-1 text-sm font-black text-slate-950">
                        Payment schedule
                      </legend>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <label
                          className={`cursor-pointer rounded-xl border-2 p-4 ${
                            paymentPlan === 'full'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment-plan"
                            value="full"
                            checked={paymentPlan === 'full'}
                            onChange={() => setPaymentPlan('full')}
                            className="mr-2"
                          />
                          <span className="font-bold text-slate-950">Pay in full</span>
                          <span className="mt-1 block text-xs text-slate-600">
                            One secure payment
                          </span>
                        </label>
                        <label
                          className={`cursor-pointer rounded-xl border-2 p-4 ${
                            paymentPlan === 'installments'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment-plan"
                            value="installments"
                            checked={paymentPlan === 'installments'}
                            onChange={() => setPaymentPlan('installments')}
                            className="mr-2"
                          />
                          <span className="font-bold text-slate-950">Deposit + payment plan</span>
                          <span className="mt-1 block text-xs text-slate-600">
                            $ {((/apprentice/i.test(program.slug || '') && Number.isFinite(downPaymentCents(downPayment)) ? downPaymentCents(downPayment) : getInitialProgramInvoiceCents(program.slug || '', Math.round(Number(program.price ?? program.total_cost ?? 0) * 100))) / 100).toLocaleString()} down; remaining tuition billed separately
                          </span>
                        </label>
                      </div>
                      {/apprentice/i.test(program.slug || '') && paymentPlan === 'installments' ? (
                        <div className="mt-4"><ProgramDepositCalculator slug={program.slug!} tuitionCents={Math.round(Number(program.price ?? program.total_cost) * 100)} value={downPayment} onChange={setDownPayment} /></div>
                      ) : null}
                      <p className="mt-3 text-xs leading-5 text-slate-600">
                        QuickBooks shows the online card or ACH methods enabled for your invoice.
                        This installment schedule is not third-party BNPL.
                      </p>
                    </fieldset>
                  ) : (
                    <p className="mb-4 text-sm font-bold">
                      Tuition must be confirmed before class registration. Eligible learners can
                      request Affirm Buy Now, Pay Later for their Elevate invoice; approval and
                      repayment terms are determined by Affirm.
                    </p>
                  )}

                  {!onlineSchoolProgram ? (
                    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:mb-6">
                      <label
                        htmlFor="enrollment-coupon"
                        className="flex items-center gap-2 text-sm font-black text-blue-950"
                      >
                        <Tag className="h-5 w-5 text-blue-700" /> Coupon or promotion code
                      </label>
                      <input
                        id="enrollment-coupon"
                        type="text"
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        autoComplete="off"
                        className="mt-3 block w-full rounded-lg border border-blue-300 bg-white px-3 py-3 font-semibold uppercase tracking-wide text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <p className="mt-2 text-xs leading-5 text-blue-800">
                        Active Elevate codes are validated securely before the QuickBooks invoice is
                        created. For partner programs, a coupon can reduce only Elevate&apos;s
                        portion; the training provider&apos;s approved share remains protected.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {enrolling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {program?.is_free === true || program?.funding_eligible
                        ? 'Complete Enrollment'
                        : program?.price || program?.total_cost
                          ? 'Continue to Secure Payment'
                          : 'Complete Enrollment'}
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
