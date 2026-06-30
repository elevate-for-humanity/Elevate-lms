import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'You Are Enrolled | Cosmetology Apprenticeship',
  description: 'Your enrollment in the Cosmetology Apprenticeship program is confirmed.',
};

export default async function EnrollmentSuccessPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/programs/cosmetology-apprenticeship/enrollment-success');
  }

  // Get enrollment
  let { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .maybeSingle();

  // Fall back to checking by email for public-checkout users
  if (!enrollment) {
    const { data: byEmail } = await supabase
      .from('program_enrollments')
      .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
      .eq('email', user.email || '')
      .order('enrolled_at', { ascending: false })
      .maybeSingle();
    enrollment = byEmail;
  }

  const programName = enrollment?.programs?.name || 'Cosmetology Apprenticeship';
  const programSlug = enrollment?.programs?.slug || 'cosmetology-apprenticeship';

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-9 h-9 text-brand-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">You Are Enrolled!</h1>
            <p className="text-lg text-slate-600">
              Congratulations! Your enrollment in <strong>{programName}</strong> is confirmed.
            </p>
          </div>

          {/* Next steps */}
          <div className="space-y-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="font-semibold text-blue-900 mb-4">What Happens Next?</h2>
              <ol className="space-y-3 text-sm text-blue-900">
                <li className="flex gap-3">
                  <span className="font-bold flex-shrink-0">1.</span>
                  <span>Complete your onboarding by <strong>Day 1 of your apprenticeship</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold flex-shrink-0">2.</span>
                  <span>Receive schedule and orientation details via email</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold flex-shrink-0">3.</span>
                  <span>Start earning while you learn</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold flex-shrink-0">4.</span>
                  <span>Access your dashboard to track progress</span>
                </li>
              </ol>
            </div>

            {/* Dashboard access */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Your Dashboard</h3>
              <p className="text-slate-600 text-sm mb-4">
                Track your apprenticeship progress, submit assignments, and access course materials.
              </p>
              <Link
                href="/learner/dashboard"
                className="inline-block px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold text-sm"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {/* Contact info */}
          <div className="border-t border-slate-200 pt-6 mb-6">
            <p className="text-sm text-slate-600 mb-2">Questions? We're here to help.</p>
            <p className="text-sm text-slate-900">
              <strong>Email:</strong> <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">elevate4humanityedu@gmail.com</a><br />
              <strong>Phone:</strong> <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-brand-blue-600 hover:underline">{PLATFORM_DEFAULTS.supportPhone}</a>
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/learner/dashboard"
              className="block w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold text-center"
            >
              View My Dashboard
            </Link>
            <Link
              href={`/programs/${programSlug}`}
              className="block w-full px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-center"
            >
              Back to Program Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
