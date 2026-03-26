import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'You Are Enrolled | Tax Preparation & Financial Services | Elevate for Humanity',
  description: 'Your enrollment in the Tax Preparation & Financial Services program is confirmed.',
};

export default async function EnrollmentSuccessPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/error?message=service-unavailable');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/programs/tax-preparation/enrollment-success');
  }

  // Get enrollment — first by user_id, then by email for public-checkout users
  let { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment && user.email) {
    const normalizedEmail = user.email.toLowerCase().trim();
    const { data: emailMatch } = await supabase
      .from('program_enrollments')
      .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
      .ilike('email', normalizedEmail)
      .is('user_id', null)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emailMatch) {
      await supabase
        .from('program_enrollments')
        .update({ user_id: user.id })
        .eq('id', emailMatch.id);
      enrollment = { ...emailMatch, user_id: user.id };
    }
  }

  if (!enrollment) {
    redirect('/programs/tax-preparation');
  }

  // Mark enrollment as confirmed if not already
  if (enrollment.status === 'paid' || enrollment.status === 'approved') {
    await supabase
      .from('program_enrollments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', enrollment.id);
  }

  const programName = (enrollment.programs as { name?: string })?.name || 'Tax Preparation & Financial Services';

  // Calculate start date (next Monday after enrollment)
  const enrolledDate = enrollment?.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
  const daysUntilMonday = (8 - enrolledDate.getDay()) % 7 || 7;
  const startDate = new Date(enrolledDate);
  startDate.setDate(startDate.getDate() + daysUntilMonday);
  const formattedStartDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-slate-500 flex-shrink-0">•</span>
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-2">
            You are now officially enrolled.
          </h1>
        </div>

        {/* Enrollment Details Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Program</span>
              <span className="font-bold text-slate-900">{programName}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Status</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-100 text-brand-green-700 rounded-full font-bold text-sm">
                <span className="w-2 h-2 bg-brand-green-500 rounded-full"></span>
                Active
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Start Date</span>
              <span className="font-bold text-slate-900">{formattedStartDate}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Duration</span>
              <span className="font-bold text-slate-900">10 weeks (150 hours)</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Cost</span>
              <span className="font-bold text-slate-900">$0 (WIOA funded)</span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600">Sponsor</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-blue-600" />
                <span className="font-bold text-slate-900">Elevate for Humanity</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 text-center pt-2">
              IRS VITA Track — Credentials: IRS VITA/TCE, QuickBooks ProAdvisor, Microsoft 365
            </div>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Before You Start</h2>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs">1</span>
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">Set up your IRS Link &amp; Learn account</h3>
                  <p className="text-slate-500 text-xs mt-0.5">For your VITA/TCE certification exam in Week 10.</p>
                  <a
                    href="https://apps.irs.gov/app/vita/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-green-600 text-xs mt-1 hover:underline"
                  >
                    Create account <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs">2</span>
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">Enroll in Intuit for Education (free)</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Financial literacy curriculum delivered in Week 5.</p>
                  <a
                    href="https://intuit4education.app.intuit.com/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-green-600 text-xs mt-1 hover:underline"
                  >
                    Sign up <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Primary CTA — go to program dashboard */}
        <Link
          href={`/lms/program/${enrollment.program_id}`}
          className="block w-full bg-brand-green-600 hover:bg-brand-green-700 text-white text-center py-5 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg"
        >
          Go to My Program Dashboard
        </Link>

        <p className="text-slate-500 text-sm text-center mt-4">
          View your courses, track progress, and start learning.
        </p>

        {/* Help */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Questions? Call{' '}
          <a href="tel:317-314-3757" className="text-slate-300 hover:underline">317-314-3757</a>
          {' '}or{' '}
          <Link href="/contact" className="text-slate-300 hover:underline">contact us</Link>
        </p>
      </div>
    </div>
  );
}
