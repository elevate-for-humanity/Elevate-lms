import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CheckCircle, Mail, Lock, BookOpen, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrollment Confirmed | Barber Apprenticeship | Elevate for Humanity',
  description: 'Your enrollment in the Barber Apprenticeship program is confirmed.',
};

export default async function EnrollmentSuccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Calculate next Monday as start date
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + daysUntilMonday);
  const formattedStartDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  // If already logged in, show portal link; otherwise show email instructions
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-green-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-2xl">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Enrollment Confirmed
          </h1>
          <p className="text-slate-400 text-lg">Barber Apprenticeship Program</p>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="p-6 space-y-0 divide-y divide-slate-100">
            {[
              { label: 'Program', value: 'Barber Apprenticeship' },
              { label: 'Status', value: 'Active', badge: true },
              { label: 'Estimated Start', value: formattedStartDate },
              { label: 'Sponsor', value: 'Elevate for Humanity', icon: true },
            ].map(({ label, value, badge, icon }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-slate-500 text-sm">{label}</span>
                {badge ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-green-100 text-brand-green-700 rounded-full font-bold text-sm">
                    <span className="w-2 h-2 bg-brand-green-500 rounded-full" />
                    {value}
                  </span>
                ) : icon ? (
                  <span className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    <Shield className="w-4 h-4 text-brand-blue-600" />
                    {value}
                  </span>
                ) : (
                  <span className="font-bold text-slate-900 text-sm">{value}</span>
                )}
              </div>
            ))}
          </div>
          <div className="bg-slate-50 px-6 py-3 text-center text-xs text-slate-400">
            USDOL Registered Apprenticeship Program
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold mb-4">What happens next</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">1</div>
              <div>
                <p className="text-white font-semibold text-sm">Check your email</p>
                <p className="text-slate-400 text-sm mt-0.5">You&apos;ll receive a &quot;Set Your Password&quot; email within a few minutes. Click the button in that email to create your account password.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
              <div>
                <p className="text-white font-semibold text-sm">Log in to your student portal</p>
                <p className="text-slate-400 text-sm mt-0.5">After setting your password, log in at elevateforhumanity.org/login to access your dashboard and coursework.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">3</div>
              <div>
                <p className="text-white font-semibold text-sm">Complete orientation</p>
                <p className="text-slate-400 text-sm mt-0.5">A short online orientation (~10 min) unlocks your full program dashboard and hour-logging tools.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA — different if logged in vs not */}
        {isLoggedIn ? (
          <Link
            href="/programs/barber-apprenticeship/orientation"
            className="flex items-center justify-center gap-2 w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
          >
            <BookOpen className="w-5 h-5" />
            Start Orientation Now
          </Link>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <Mail className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-amber-200 text-sm">
                <strong>Check your email</strong> for a &quot;Set Your Password&quot; link. It may take 1–2 minutes to arrive.
              </p>
            </div>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 text-center py-4 rounded-xl font-semibold transition-all"
            >
              <Lock className="w-4 h-4" />
              Already set your password? Log In
            </Link>
          </div>
        )}

        <p className="text-slate-500 text-xs text-center mt-5">
          Questions? Call (317) 314-3757 or email{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="text-slate-400 hover:text-white underline">
            elevate4humanityedu@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
