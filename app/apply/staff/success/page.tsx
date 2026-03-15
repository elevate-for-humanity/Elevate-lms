import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Application Submitted',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/staff/success',
  },
};

export default async function StaffApplicationSuccess() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Log success page visit
  await db.from('page_views').insert({ page: 'staff_application_success' }).select();
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green-100 text-brand-green-700 mb-4">
          <span className="text-slate-400 flex-shrink-0">•</span>
        </div>
        <h1 className="text-3xl font-bold text-black mb-3">
          Application Submitted!
        </h1>
        <p className="text-lg text-black mb-6">
          Thank you for your interest in joining our team. We'll review your
          application and contact you if we'd like to move forward.
        </p>
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-6 text-left">
          <h2 className="font-semibold text-black mb-2">What's Next?</h2>
          <ol className="space-y-2 text-sm text-black">
            <li>1. Our team will review your qualifications</li>
            <li>2. If selected, we'll contact you to schedule an interview</li>
            <li>3. After approval, you'll receive onboarding instructions</li>
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
