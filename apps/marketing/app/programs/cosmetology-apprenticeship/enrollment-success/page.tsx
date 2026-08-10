import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrollment Confirmed | Cosmetology Apprenticeship',
  description: 'Your Cosmetology Apprenticeship enrollment status and next steps.',
  robots: { index: false, follow: false },
};

export default async function EnrollmentSuccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/programs/cosmetology-apprenticeship/enrollment-success');
  }

  let { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .maybeSingle();

  if (!enrollment && user.email) {
    const { data: byEmail } = await supabase
      .from('program_enrollments')
      .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
      .eq('email', user.email)
      .order('enrolled_at', { ascending: false })
      .maybeSingle();
    enrollment = byEmail;
  }

  if (!enrollment) {
    redirect('/programs/cosmetology-apprenticeship');
  }

  const programRelation = Array.isArray(enrollment.programs)
    ? enrollment.programs[0]
    : enrollment.programs;
  const programName = programRelation?.name || 'Cosmetology Apprenticeship';
  const programSlug = programRelation?.slug || 'cosmetology-apprenticeship';
  const dashboardUrl = `https://app.elevateforhumanity.org/apprentice?program=${encodeURIComponent(programSlug)}`;

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-9 h-9 text-brand-green-700" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Enrollment Confirmed</h1>
            <p className="text-lg text-slate-700">
              Your enrollment record for <strong>{programName}</strong> is active.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="font-semibold text-blue-950 mb-4">Next Steps</h2>
              <ol className="space-y-3 text-sm text-blue-950">
                <li className="flex gap-3"><span className="font-bold">1.</span><span>Complete the apprenticeship onboarding items assigned in your portal.</span></li>
                <li className="flex gap-3"><span className="font-bold">2.</span><span>Review your host-site, schedule, and orientation details when they are posted.</span></li>
                <li className="flex gap-3"><span className="font-bold">3.</span><span>Use the Apprentice dashboard to track approved OJL/RTI progress and documents.</span></li>
              </ol>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Apprentice Dashboard</h3>
              <p className="text-slate-700 text-sm mb-4">
                Access training, hours, documents, and apprenticeship progress from the LMS portal.
              </p>
              <a
                href={dashboardUrl}
                className="inline-block px-6 py-2 bg-brand-blue-700 text-white rounded-lg hover:bg-brand-blue-800 transition font-semibold text-sm"
              >
                Open Apprentice Dashboard
              </a>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 mb-6">
            <p className="text-sm text-slate-700 mb-2">Questions? Contact Elevate support.</p>
            <p className="text-sm text-slate-900">
              <strong>Email:</strong>{' '}
              <a href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`} className="text-brand-blue-700 hover:underline">
                {PLATFORM_DEFAULTS.supportEmail}
              </a><br />
              <strong>Phone:</strong>{' '}
              <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="text-brand-blue-700 hover:underline">
                {PLATFORM_DEFAULTS.supportPhone}
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={dashboardUrl}
              className="block w-full px-6 py-3 bg-brand-blue-700 text-white rounded-lg hover:bg-brand-blue-800 transition font-semibold text-center"
            >
              View My Dashboard
            </a>
            <Link
              href={`/programs/${programSlug}`}
              className="block w-full px-6 py-2 border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 transition text-center"
            >
              Back to Program Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
