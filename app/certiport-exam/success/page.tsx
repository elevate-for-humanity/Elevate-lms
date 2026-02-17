'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, MapPin, ArrowRight, Circle, } from 'lucide-react';
import { CERTIPORT_EXAMS } from '@/lib/partners/certiport';

function SuccessContent() {
  const searchParams = useSearchParams();
  const examCode = searchParams.get('exam') as CertiportExamCode | null;
  const sessionId = searchParams.get('session_id');
  const status = searchParams.get('status') || (sessionId ? 'paid' : 'pending');

  const [examName, setExamName] = useState('');

  useEffect(() => {
    if (examCode && CERTIPORT_EXAMS[examCode]) {
      setExamName(CERTIPORT_EXAMS[examCode].name);
    }
  }, [examCode]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {status === 'paid' ? 'Payment Received' : 'Exam Request Submitted'}
          </h1>

          {examName && (
            <p className="text-brand-blue-600 font-semibold mb-4">{examName}</p>
          )}

          <p className="text-slate-600 mb-8">
            {status === 'paid'
              ? 'Your payment has been received. Our team will assign your exam voucher within 1-2 business days.'
              : 'Your exam request has been submitted. Your voucher will be assigned within 1-2 business days.'}
          </p>

          <div className="bg-slate-50 rounded-xl p-6 text-left mb-6 space-y-4">
            <h2 className="font-semibold text-slate-900">What Happens Next</h2>
            <div className="space-y-3">
              {[
                { icon: Clock, text: 'Voucher assigned within 1-2 business days' },
                { icon: Circle, text: 'You will receive an email with your voucher code' },
                { icon: MapPin, text: 'Schedule your exam at the Elevate testing center' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <step.icon className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{step.text}</p>
                </div>
              ))}
            </div>
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

          <Link
            href="/certiport-exam"
            className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-medium"
          >
            Check Voucher Status
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CertiportExamSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
