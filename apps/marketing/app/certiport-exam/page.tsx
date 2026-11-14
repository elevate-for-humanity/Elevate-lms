'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { createClient } from '@/lib/supabase/client';
import { Award, Lock, ArrowRight, Shield, MapPin, Clock } from 'lucide-react';
import { CERTIPORT_EXAMS, CERTIPORT_CATC_ADDRESS, type CertiportExamCode } from '@/lib/partners/certiport';
import { CERTIPORT_FEES } from '@/lib/testing/providers/certiport-pricing';
import { getProvidersForAmount } from '@/lib/bnpl-config';

const CATEGORY_PRICE_MAP: Record<string, number> = {
  'Microsoft Office': CERTIPORT_FEES[0].amount,
  'Digital Literacy': CERTIPORT_FEES[0].amount,
  'IT': CERTIPORT_FEES[0].amount,
  'Business': CERTIPORT_FEES[1].amount,
};

type FundingStatus = 'funded' | 'self_pay' | 'loading';
type CourseStatus = 'complete' | 'incomplete' | 'loading';

export default function CertiportExamPage() {
  return <CertiportExamContent />;
}

function CertiportExamContent() {
  const router = useRouter();
  const searchParams = useSafeSearchParams();
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

      const { data: enrollment } = await supabase
        .from('program_enrollments')
        .select('funding_source, program_slug')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const source = enrollment?.funding_source || 'SELF_PAY';
      setFundingStatus(source === 'SELF_PAY' ? 'self_pay' : 'funded');
      setCourseStatus('complete');

      const { data: existing } = await supabase
        .from('certiport_exam_requests')
        .select('status, voucher_code, exam_code')
        .eq('user_id', user.id)
        .in('status', ['pending', 'paid', 'voucher_assigned'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setExistingRequest({ status: existing.status, voucherCode: existing.voucher_code });
        if (existing.exam_code in CERTIPORT_EXAMS) {
          setSelectedExam(existing.exam_code as CertiportExamCode);
        }
      }
    }

    void loadStatus();
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
        window.location.href = data.checkoutUrl;
        return;
      }

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
    {} as Record<string, Array<{ code: CertiportExamCode; name: string; category: string; passingScore: number }>>,
  );

  if (existingRequest?.status === 'voucher_assigned' && existingRequest.voucherCode) {
    return (
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="h-8 w-8 text-brand-green-700" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your Exam Voucher</h1>
            <p className="text-slate-600 mb-6">Present this code at the testing center.</p>
            <div className="bg-brand-blue-700 text-white rounded-xl p-6 mb-6">
              <p className="text-sm text-blue-100 mb-1">Voucher Code</p>
              <p className="text-3xl font-mono font-bold tracking-wider">{existingRequest.voucherCode}</p>
            </div>
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 text-left mb-6">
              <h3 className="font-semibold text-brand-blue-900 flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" /> Testing Center
              </h3>
              <p className="text-brand-blue-800 text-sm">
                Elevate for Humanity Career &amp; Technical Institute<br />{CERTIPORT_CATC_ADDRESS}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-brand-blue-700 text-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8" aria-hidden="true" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Certiport Exam Request</h1>
                <p className="text-blue-100">Select an available certification exam and request your voucher or checkout.</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-7">
            {cancelled ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">Checkout was cancelled. Your exam request was not completed.</div> : null}
            {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4"><Shield className="h-5 w-5 text-brand-blue-700 mb-2" /><p className="font-semibold">Funding check</p><p className="text-sm text-slate-600">{fundingStatus === 'loading' ? 'Checking…' : fundingStatus === 'funded' ? 'Funding source on file' : 'Self-pay'}</p></div>
              <div className="rounded-xl border border-slate-200 p-4"><Clock className="h-5 w-5 text-brand-blue-700 mb-2" /><p className="font-semibold">Course status</p><p className="text-sm text-slate-600">{courseStatus === 'loading' ? 'Checking…' : courseStatus === 'complete' ? 'Ready for request validation' : 'Course incomplete'}</p></div>
              <div className="rounded-xl border border-slate-200 p-4"><Lock className="h-5 w-5 text-brand-blue-700 mb-2" /><p className="font-semibold">Secure request</p><p className="text-sm text-slate-600">Voucher assignment and payment are handled server-side.</p></div>
            </div>

            {Object.entries(examCategories).map(([category, exams]) => (
              <section key={category}>
                <h2 className="text-lg font-bold text-slate-900 mb-3">{category}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {exams.map((exam) => {
                    const selected = selectedExam === exam.code;
                    const price = CATEGORY_PRICE_MAP[category] ?? CERTIPORT_FEES[0].amount;
                    return (
                      <button
                        type="button"
                        key={exam.code}
                        onClick={() => setSelectedExam(exam.code)}
                        className={`text-left rounded-xl border p-4 transition ${selected ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}
                      >
                        <p className="font-semibold text-slate-900">{exam.name}</p>
                        <p className="mt-1 text-sm text-slate-600">Passing score: {exam.passingScore}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">Listed exam fee: ${price}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            {fundingStatus === 'self_pay' && selectedExam ? (
              <p className="text-sm text-slate-600">Payment options for the selected amount may include: {getProvidersForAmount(CATEGORY_PRICE_MAP[CERTIPORT_EXAMS[selectedExam].category] ?? CERTIPORT_FEES[0].amount).join(', ') || 'card payment'}.</p>
            ) : null}

            <button
              type="button"
              disabled={!selectedExam || submitting || courseStatus === 'incomplete'}
              onClick={handleSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-bold text-white hover:bg-brand-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
