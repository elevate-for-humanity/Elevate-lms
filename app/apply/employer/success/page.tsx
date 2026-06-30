import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Building2, Users, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Application Submitted',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/employer/success',
  },
};

export default async function EmployerApplicationSuccess() {
  const supabase = await createClient();
  // Best-effort page view log — ignore errors
  await supabase
    .from('page_views')
    .insert({ page: 'employer_application_success' })
    .then(() => null)
    .catch(() => null);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center mb-6 shadow-sm">
          <CheckCircle className="w-16 h-16 text-brand-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Application Submitted!</h1>
          <p className="text-lg text-slate-600 mb-6">
            Thank you for your interest in partnering with us. We&apos;ll review your application
            and contact you within 1–2 business days.
          </p>

          {/* What's next */}
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-6 text-left">
            <h2 className="font-semibold text-slate-900 mb-3">What happens next</h2>
            <ol className="space-y-3">
              {[
                { icon: Building2, text: 'Our team verifies your company information' },
                { icon: Users, text: 'You receive an email with your account credentials' },
                {
                  icon: BookOpen,
                  text: 'Once approved, complete onboarding to access your employer dashboard',
                },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-brand-blue-700" />
                  </div>
                  <span className="text-sm text-slate-700">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Onboarding CTA */}
        <div className="bg-white border border-brand-blue-200 rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-1">Ready to get started?</h2>
          <p className="text-sm text-slate-600 mb-4">
            You can begin employer onboarding now while we review your application.
          </p>
          <Link
            href="/onboarding/employer"
            className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors w-full justify-center"
          >
            Start Employer Onboarding <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            Return to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
