'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Award, Lock, ArrowRight, Shield, MapPin, Clock } from 'lucide-react';
import { CERTIPORT_EXAMS } from '@/lib/partners/certiport';

type FundingStatus = 'funded' | 'self_pay' | 'loading';
type CourseStatus = 'complete' | 'incomplete' | 'loading';

export default function CertiportExamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Loading...</p></div>}>
      <CertiportExamContent />
    </Suspense>
  );
}

function CertiportExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');

  const [selectedExam, setSelectedExam] = useState<CertiportExamCode | ''>('');
  const [fundingStatus, setFundingStatus] = useState<FundingStatus>('loading');
  const [courseStatus, setCourseStatus] = useState<CourseStatus>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingRequest, setExistingRequest] = useState<{
    status: string;
    voucherCode?: string;
  } | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/certiport-exam');
        return;
      }

      // Check funding status from most recent enrollment
      const { data: enrollment } = await supabase
        .from('program_enrollments')
        .select('funding_source, program_slug')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const source = enrollment?.funding_source || 'SELF_PAY';
      setFundingStatus(source === 'SELF_PAY' ? 'self_pay' : 'funded');

      // Check if course is complete (simplified — checks any active enrollment)
      setCourseStatus('complete'); // Default to complete; API route does the real check

      // Check for existing exam request
      const { data: existing } = await supabase
        .from('certiport_exam_requests')
        .select('status, voucher_code, exam_code')
        .eq('user_id', user.id)
        .in('status', ['pending', 'paid', 'voucher_assigned'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        setExistingRequest({
          status: existing.status,
          voucherCode: existing.voucher_code,
        });
        setSelectedExam(existing.exam_code as CertiportExamCode);
      }
    }

    loadStatus();
  }, [router]);

  const handleSubmit = async () => {
    if (!selectedExam) return;
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/certiport-exam/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examCode: selectedExam }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit request');
        return;
      }

      if (data.path === 'self_pay' && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
        return;
      }

      // Funded path — request submitted
      router.push(`/certiport-exam/success?exam=${selectedExam}&status=pending`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const examCategories = Object.entries(CERTIPORT_EXAMS).reduce(
    (acc, [code, exam]) => {
      if (!acc[exam.category]) acc[exam.category] = [];
      acc[exam.category].push({ code: code as CertiportExamCode, ...exam });
      return acc;
    },
    {} as Record<string, Array<{ code: CertiportExamCode; name: string; category: string; passingScore: number }>>
  );

  // If voucher already assigned, show it
  if (existingRequest?.status === 'voucher_assigned' && existingRequest.voucherCode) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Your Exam Voucher</h1>
            <p className="text-slate-600 mb-6">Present this code at the testing center.</p>

            <div className="bg-slate-900 text-white rounded-xl p-6 mb-6">
              <p className="text-sm text-slate-400 mb-1">Voucher Code</p>
              <p className="text-3xl font-mono font-bold tracking-wider">{existingRequest.voucherCode}</p>
            </div>

            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 text-left mb-6">
              <h3 className="font-semibold text-brand-blue-900 flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" /> Testing Center
              </h3>
              <p className="text-brand-blue-800 text-sm">
                Elevate for Humanity Career & Technical Institute<br />
                7009 E 56th St, Suite F<br />
                Indianapolis, IN 46226
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" /> What to Bring
              </h3>
              <ul className="text-amber-800 text-sm space-y-1">
                <li>- Government-issued photo ID</li>
                <li>- Your voucher code (shown above)</li>
                <li>- Arrive 15 minutes early</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If request is pending
  if (existingRequest?.status === 'pending' || existingRequest?.status === 'paid') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-brand-blue-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Exam Request Submitted</h1>
            <p className="text-slate-600 mb-4">
              {existingRequest.status === 'paid'
                ? 'Payment received. Your voucher will be assigned within 1-2 business days.'
                : 'Your voucher will be assigned within 1-2 business days.'}
            </p>
            <p className="text-sm text-slate-500">
              You will receive an email when your voucher is ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Certification Exam</h1>
          <p className="text-slate-600 mt-2">
            Select your exam below. {fundingStatus === 'funded'
              ? 'Your exam is covered by your funding program.'
              : 'Exam fee: $150.'}
          </p>
        </div>

        {cancelled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-amber-800">Payment was cancelled. You can try again when ready.</p>
          </div>
        )}

        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-brand-red-800">{error}</p>
          </div>
        )}

        {/* Funding badge */}
        <div className="mb-6">
          {fundingStatus === 'funded' ? (
            <div className="flex items-center gap-2 bg-brand-green-50 border border-brand-green-200 rounded-lg px-4 py-3">
              <Shield className="w-5 h-5 text-brand-green-600" />
              <span className="text-brand-green-800 font-medium">Funded Program — No exam fee</span>
            </div>
          ) : fundingStatus === 'self_pay' ? (
            <div className="flex items-center gap-2 bg-brand-blue-50 border border-brand-blue-200 rounded-lg px-4 py-3">
              <Shield className="w-5 h-5 text-brand-blue-600" />
              <span className="text-brand-blue-800 font-medium">Self-Pay — $150 exam fee (paid to Elevate)</span>
            </div>
          ) : null}
        </div>

        {/* Exam selection */}
        <div className="space-y-6 mb-8">
          {Object.entries(examCategories).map(([category, exams]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 px-6 py-3">
                <h2 className="text-white font-semibold">{category}</h2>
              </div>
              <div className="p-4 space-y-2">
                {exams.map((exam) => (
                  <label
                    key={exam.code}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                      selectedExam === exam.code
                        ? 'bg-brand-blue-50 border-2 border-brand-blue-500'
                        : 'hover:bg-slate-50 border-2 border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exam"
                      value={exam.code}
                      checked={selectedExam === exam.code}
                      onChange={() => setSelectedExam(exam.code)}
                      className="w-4 h-4 text-brand-blue-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{exam.name}</p>
                      <p className="text-xs text-slate-500">Passing score: {exam.passingScore}/1000</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedExam || submitting || courseStatus === 'incomplete'}
          className="w-full py-4 bg-brand-blue-600 text-white font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-blue-700 transition flex items-center justify-center gap-2"
        >
          {submitting ? (
            'Processing...'
          ) : courseStatus === 'incomplete' ? (
            <>
              <Lock className="w-5 h-5" />
              Complete Your Course First
            </>
          ) : fundingStatus === 'funded' ? (
            <>
              Request Exam Voucher
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Pay $150 & Request Exam
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-slate-500 text-sm mt-4">
          Exams are proctored on-site at the Elevate testing center.
        </p>
      </div>
    </div>
  );
}
