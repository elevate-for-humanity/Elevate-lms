'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, BookOpen } from 'lucide-react';

import { createBrowserClient } from '@supabase/ssr';
function SuccessContent() {
  const searchParams = useSearchParams();
  const program = searchParams.get('program') || 'cna';
  const type = searchParams.get('type') || 'down-payment';

  const programNames: Record<string, string> = {
    cna: 'CNA Certification',
    barber: 'Barber Apprenticeship',
    hvac: 'HVAC Technician',
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border p-8 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your {type === 'down-payment' ? 'down payment' : 'payment'} for {programNames[program] || program} has been processed.
          </p>

          <div className="bg-white rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold mb-3">What happens next?</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span>You will receive an email with your class schedule within 24 hours</span>
              </li>
              <li className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span>Access your student portal to view course materials</span>
              </li>
              {type === 'down-payment' && (
                <li className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Weekly payments of $50 will be charged every Monday</span>
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/learner/dashboard"
              className="block w-full bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700"
            >
              Go to Student Portal
            </Link>
            <Link
              href="/"
              className="block w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-white"
            >
              Return to Home
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Questions? Contact us at</p>
          <p className="font-medium">Contact Us</p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('training_courses').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
