import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  BookOpen,
  FileText,
  User,
  Video,
  ClipboardCheck,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Instructor Onboarding',
  description: 'Complete your instructor onboarding to start teaching.',
};

export const dynamic = 'force-dynamic';

export default async function InstructorOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/onboarding/instructor');

  // Fetch profile first — role check must happen before any other DB queries
  // so non-instructors are redirected without triggering unnecessary reads.
  // Use admin client only for the profile lookup (profiles table has RLS that
  // blocks users from reading their own role column in some policies).
  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('full_name, email, role, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  // Redirect non-instructors before running any further queries
  if (profile && !['instructor', 'admin', 'super_admin', 'staff'].includes(profile.role ?? '')) {
    redirect('/onboarding/learner');
  }

  // Remaining queries use the user's own session client (respects RLS)
  const [
    { data: agreements },
    { data: docs },
    { data: orientations },
    { data: programInstructors },
  ] = await Promise.all([
    supabase
      .from('license_agreement_acceptances')
      .select('id, accepted_at')
      .eq('user_id', user.id)
      .limit(1),
    supabase.from('documents').select('id, document_type').eq('user_id', user.id).limit(20),
    supabase
      .from('orientation_completions')
      .select('id, completed_at')
      .eq('user_id', user.id)
      .limit(1),
    // program_instructors uses user_id (not instructor_id) as the FK column
    supabase
      .from('program_instructors')
      .select('id, program_id, programs(title)')
      .eq('user_id', user.id)
      .limit(10),
  ]);

  const agreementDone = (agreements?.length ?? 0) > 0;
  const idUploaded =
    docs?.some((d) => d.document_type === 'id' || d.document_type === 'government_id') ?? false;
  const certUploaded =
    docs?.some((d) => d.document_type === 'certification' || d.document_type === 'credential') ??
    false;
  const orientationDone = (orientations?.length ?? 0) > 0;
  const programAssigned = (programInstructors?.length ?? 0) > 0;

  const steps = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your bio, photo, and teaching specialties',
      href: 'https://admin.elevateforhumanity.org/admin/instructor/settings',
      icon: User,
      done: !!(profile?.full_name && profile?.avatar_url),
    },
    {
      id: 'agreement',
      title: 'Sign Instructor Agreement',
      description: 'Review and sign the instructor services agreement',
      href: '/onboarding/instructor/agreement',
      icon: FileText,
      done: agreementDone,
    },
    {
      id: 'id',
      title: 'Upload Government ID',
      description: 'Required for identity verification',
      href: 'https://admin.elevateforhumanity.org/admin/instructor/documents?type=id',
      icon: ClipboardCheck,
      done: idUploaded,
    },
    {
      id: 'cert',
      title: 'Upload Credentials / Certifications',
      description: 'Upload your teaching credentials or industry certifications',
      href: 'https://admin.elevateforhumanity.org/admin/instructor/documents?type=certification',
      icon: BookOpen,
      done: certUploaded,
    },
    {
      id: 'orientation',
      title: 'Complete Orientation',
      description: 'Watch the instructor orientation video and confirm completion',
      href: '/onboarding/instructor/orientation',
      icon: Video,
      done: orientationDone,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const nextStep = steps.find((s) => !s.done);
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-5">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Instructor Onboarding', href: '/onboarding/instructor' },
          ]}
        />
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Instructor Onboarding</h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}. Complete the steps below
              to activate your instructor account.
            </p>
          </div>
          {allDone && (
            <Link
              href={`https://admin.${PLATFORM_DEFAULTS.canonicalDomain}/instructor`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-green-700"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Progress bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">
              {completedCount} of {steps.length} steps complete
            </span>
            <span className="text-sm font-bold text-blue-600">{progressPct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {allDone ? (
            <p className="mt-3 text-sm text-brand-green-600 font-medium">
              ✅ All steps complete — your instructor account is fully activated.
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Complete all steps to activate your instructor account and get assigned to programs.
            </p>
          )}
        </div>

        {/* Programs assigned */}
        {programAssigned && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Programs Assigned</p>
            <div className="flex flex-wrap gap-2">
              {programInstructors?.map((pi: any) => (
                <span
                  key={pi.id}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                >
                  {pi.programs?.title ?? 'Program'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isNext = nextStep?.id === step.id;
            return (
              <div
                key={step.id}
                className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 ${
                  step.done ? 'border-brand-green-200' : isNext ? 'border-blue-300' : 'border-slate-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    step.done ? 'bg-brand-green-100' : isNext ? 'bg-blue-100' : 'bg-slate-100'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle className="w-5 h-5 text-brand-green-600" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isNext ? 'text-blue-600' : 'text-slate-400'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-sm ${step.done ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                </div>
                {!step.done && (
                  <Link
                    href={step.href}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      isNext
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isNext ? 'Start' : 'Complete'} <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Help */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-sm text-slate-500">
            Need help? Email{' '}
            <a href="mailto:info@elevateforhumanity.org" className="text-blue-600 hover:underline">
              info@elevateforhumanity.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
