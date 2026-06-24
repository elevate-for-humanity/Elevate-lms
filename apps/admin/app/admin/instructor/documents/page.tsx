import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import InstructorDocumentsClient from './InstructorDocumentsClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Instructor Documents | ${PLATFORM_DEFAULTS.orgName}`,
  robots: { index: false, follow: false },
};

export default async function InstructorDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();


  // Guard against null user
  if (!user) redirect('/login');
  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name, first_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['instructor', 'admin', 'staff'].includes(profile.role)) {
    redirect('/onboarding/learner');
  }

  // Load existing documents for this instructor
  const { data: docs } = await db
    .from('documents')
    .select('id, document_type, file_name, created_at, status')
    .eq('user_id', user.id)
    .in('document_type', [
      'government_id',
      'instructor_certification',
      'instructor_license',
      'background_check',
    ])
    .order('created_at', { ascending: false });

  const { type: focusType } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Instructor Onboarding', href: '/onboarding/instructor' },
            { label: 'Documents' },
          ]}
        />

        <div className="mt-6">
          <h1 className="text-2xl font-bold text-slate-900">Instructor Documents</h1>
          <p className="text-slate-600 mt-1">
            Upload the required documents to complete your instructor verification. All files are
            stored securely and reviewed by the program team.
          </p>
        </div>

        <InstructorDocumentsClient
          userId={user.id}
          existingDocs={docs ?? []}
          focusType={focusType ?? null}
        />
      </div>
    </div>
  );
}
