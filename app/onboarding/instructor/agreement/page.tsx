import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import InstructorAgreementClient from './InstructorAgreementClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Instructor Services Agreement',
};

export default async function InstructorAgreementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/instructor/agreement');

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name, first_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['instructor', 'admin', 'staff'].includes(profile.role)) {
    redirect('/onboarding/learner');
  }

  // Check if already signed
  const { data: existing } = await db
    .from('license_agreement_acceptances')
    .select('id, accepted_at')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'Instructor';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Instructor Onboarding', href: '/onboarding/instructor' },
            { label: 'Services Agreement' },
          ]}
        />

        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-brand-blue-700 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Instructor Services Agreement</h1>
            <p className="text-blue-100 mt-1">Review and sign before your first assignment</p>
          </div>

          <div className="px-8 py-6 prose prose-slate max-w-none text-sm leading-relaxed">
            <p>
              This Instructor Services Agreement (&ldquo;Agreement&rdquo;) is entered into between{' '}
              <strong>{PLATFORM_DEFAULTS.orgName}</strong> (&ldquo;Elevate&rdquo;) and the instructor
              identified below (&ldquo;Instructor&rdquo;).
            </p>

            <h3>1. Scope of Services</h3>
            <p>
              Instructor agrees to deliver curriculum, facilitate learning activities, assess
              student progress, and maintain accurate attendance and grade records for programs
              assigned by Elevate. All instruction must align with the approved curriculum and
              program standards.
            </p>

            <h3>2. Confidentiality</h3>
            <p>
              Instructor agrees to maintain the confidentiality of all student records, personal
              information, and proprietary curriculum materials. Student data is protected under
              FERPA and may not be disclosed without written authorization.
            </p>

            <h3>3. Professional Standards</h3>
            <p>
              Instructor agrees to maintain professional conduct, arrive prepared for all sessions,
              communicate proactively with program coordinators, and complete required documentation
              within 24 hours of each session.
            </p>

            <h3>4. Intellectual Property</h3>
            <p>
              Curriculum materials developed for Elevate programs remain the property of Elevate for
              Humanity. Instructors retain rights to their pre-existing materials but grant Elevate
              a non-exclusive license to use them within assigned programs.
            </p>

            <h3>5. Compensation</h3>
            <p>
              Compensation terms are defined in the separate offer letter or rate schedule provided
              by Elevate. Payment is contingent on submission of accurate session logs and student
              attendance records.
            </p>

            <h3>6. Term and Termination</h3>
            <p>
              This agreement is effective upon signing and continues until terminated by either
              party with 14 days written notice. Elevate may terminate immediately for cause,
              including breach of confidentiality or professional standards.
            </p>

            <h3>7. Compliance</h3>
            <p>
              Instructor agrees to comply with all applicable federal, state, and local laws,
              including FERPA, WIOA requirements, and any program-specific compliance obligations
              communicated by Elevate.
            </p>
          </div>

          <InstructorAgreementClient
            userId={user.id}
            firstName={firstName}
            alreadySigned={!!existing}
            signedAt={existing?.accepted_at ?? null}
          />
        </div>
      </div>
    </div>
  );
}
