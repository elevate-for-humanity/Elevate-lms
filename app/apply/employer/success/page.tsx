import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Application Submitted',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/employer/success',
  },
};

export default async function EmployerApplicationSuccess() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Log page visit
  await supabase.from('page_views').insert({ page: 'employer_application_success' }).select();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-700 mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-black mb-3">
          Application Submitted!
        </h1>
        <p className="text-lg text-black mb-6">
          Thank you for your interest in partnering with us. We'll review your
          application and contact you within 1-2 business days.
        </p>
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-6 text-left">
          <h2 className="font-semibold text-black mb-2">What's Next?</h2>
          <ol className="space-y-2 text-sm text-black">
            <li>1. Our team will verify your company information</li>
            <li>2. You'll receive an email with next steps</li>
            <li>
              3. Once approved, you'll get access to your employer dashboard
            </li>
          </ol>
        </div>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
