import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, ArrowRight, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orientation Complete | Elevate for Humanity',
  robots: { index: false, follow: false },
};

// Funding sources that require Indiana Career Connect registration
const WIOA_SOURCES = new Set([
  'wioa',
  'workone',
  'workforce_ready_grant',
  'wrg',
  'jri',
]);

export default async function OrientationCompletePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Confirm orientation was actually completed — guard against direct navigation
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, full_name, orientation_completed')
    .eq('id', user.id)
    .single();

  if (!profile?.orientation_completed) {
    redirect('/onboarding/learner/orientation');
  }

  const firstName =
    profile.first_name || profile.full_name?.split(' ')[0] || 'there';

  // Check funding source from most recent active enrollment
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('funding_source, requested_funding_source')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const fundingSource =
    enrollment?.funding_source ||
    enrollment?.requested_funding_source ||
    'self_pay';

  const needsICC = WIOA_SOURCES.has(fundingSource.toLowerCase());

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">

        {/* Success mark */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          You&apos;re all set, {firstName}!
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Orientation is complete. Your coursework is now unlocked.
        </p>

        {/* Indiana Career Connect prompt — only for WIOA/WorkOne-funded learners */}
        {needsICC && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-semibold text-amber-900 mb-1">
              Action required — Indiana Career Connect
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed mb-4">
              Because your training is funded through WIOA or a workforce grant,
              you must create a free account at{' '}
              <strong>IndianaCareerConnect.com</strong> and schedule an
              appointment with your local WorkOne office before your funding can
              be confirmed.
            </p>

            <ol className="space-y-2 mb-4">
              {[
                <>
                  Go to{' '}
                  <a
                    href="https://www.indianacareerconnect.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-amber-900 underline underline-offset-2"
                  >
                    IndianaCareerConnect.com
                  </a>{' '}
                  and create a free account
                </>,
                'Schedule an appointment with your local WorkOne office',
                'Tell them you are enrolling in training at Elevate for Humanity',
                'They will confirm your eligibility and issue a training voucher',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg px-3 py-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open IndianaCareerConnect.com
            </a>
          </div>
        )}

        {/* Next steps card */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            What happens next
          </h2>
          <ul className="space-y-2">
            {[
              'Your first lesson is ready in your dashboard',
              'Progress is saved automatically as you complete each lesson',
              'Checkpoints unlock the next module — pass at 70% or higher',
              'Your certificate is issued automatically when you finish the program',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/my-dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Go to My Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Questions? Call{' '}
          <a href="tel:+13173143757" className="underline">
            (317) 314-3757
          </a>{' '}
          or email{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="underline">
            info@elevateforhumanity.org
          </a>
        </p>
      </div>
    </div>
  );
}
