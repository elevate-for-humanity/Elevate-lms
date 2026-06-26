import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  BookOpen,
  FileText,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'School Partner Onboarding',
  description: 'Complete your school partner onboarding to begin offering Elevate programs.',
};

export const dynamic = 'force-dynamic';

export default async function SchoolOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/school');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .maybeSingle();

  if (
    profile &&
    !['program_holder', 'admin', 'staff'].includes(profile.role ?? '')
  ) {
    redirect('/onboarding/learner');
  }

  const [{ data: mouRecord }, { data: handbookAck }, { data: docs }] = await Promise.all([
    supabase
      .from('mou_agreements')
      .select('id, signed_at, status')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('handbook_acknowledgments').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('documents').select('id, document_type').eq('user_id', user.id).limit(20),
  ]);

  const mouSigned = !!mouRecord?.signed_at;
  const handbookDone = !!handbookAck;
  const orgDocUploaded =
    docs?.some((d) =>
      ['w9', 'business_license', 'org_docs'].includes(d.document_type ?? ''),
    ) ?? false;

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const steps = [
    {
      id: 'orientation',
      label: 'School Orientation',
      description:
        'Learn how Elevate programs work and your responsibilities as a school partner.',
      href: '/onboarding/school/orientation',
      icon: GraduationCap,
      done: true, // landing on this page counts as started
    },
    {
      id: 'handbook',
      label: 'Partner Handbook',
      description:
        'Review the program-holder handbook covering WIOA compliance, reporting, and student support.',
      href: '/onboarding/handbook',
      icon: BookOpen,
      done: handbookDone,
    },
    {
      id: 'documents',
      label: 'Upload Organization Documents',
      description: 'Submit your W-9, business license, and any required organizational documents.',
      href: '/program-holder/documents/upload',
      icon: FileText,
      done: orgDocUploaded,
    },
    {
      id: 'mou',
      label: 'Sign Memorandum of Understanding',
      description:
        `Review and sign the MOU that governs your partnership with ${PLATFORM_DEFAULTS.orgName}.`,
      href: '/onboarding/mou',
      icon: ClipboardCheck,
      done: mouSigned,
    },
    {
      id: 'portal',
      label: 'Access Your Partner Portal',
      description:
        'Set up your program-holder portal to manage students, reports, and compliance.',
      href: '/program-holder/dashboard',
      icon: Users,
      done: false,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding' }, { label: 'School Partner' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="bg-brand-blue-700 px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-7 h-7 text-white opacity-80" />
              <h1 className="text-2xl font-bold text-white">School Partner Onboarding</h1>
            </div>
            <p className="text-blue-100">
              Welcome{firstName ? `, ${firstName}` : ''}. Complete these steps to activate your
              partnership and begin offering Elevate programs at your site.
            </p>
          </div>

          {/* Progress */}
          <div className="px-8 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                {completedCount} of {steps.length} steps complete
              </span>
              {allDone && (
                <span className="text-sm font-semibold text-brand-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> All done
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-brand-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(completedCount / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="divide-y divide-slate-100">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="px-8 py-5 flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.done ? (
                      <CheckCircle className="w-6 h-6 text-brand-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <h3 className="font-semibold text-slate-900">{step.label}</h3>
                      {step.done && (
                        <span className="text-xs bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded-full font-medium">
                          Complete
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </div>
                  <Link
                    href={step.href}
                    className="flex-shrink-0 flex items-center gap-1 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-800"
                  >
                    {step.done ? 'Review' : 'Start'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {allDone ? (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-brand-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-brand-green-800 mb-1">Onboarding complete</h2>
            <p className="text-sm text-brand-green-700 mb-4">
              Your school partner account is active. Access your portal to manage students and
              programs.
            </p>
            <Link
              href="/program-holder/dashboard"
              className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-green-700"
            >
              Go to Partner Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-blue-800">Need help?</p>
              <p className="text-sm text-brand-blue-600">
                Contact your Elevate coordinator or email{' '}
                <a href="mailto:partners@elevateforhumanity.org" className="underline">
                  partners@elevateforhumanity.org
                </a>
              </p>
            </div>
            <Link
              href="/contact"
              className="flex-shrink-0 text-sm font-medium text-brand-blue-700 hover:underline"
            >
              Contact us
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
