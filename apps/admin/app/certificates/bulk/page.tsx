import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import BulkIssueForm from './BulkIssueForm';
import BulkCertificationsClient from './BulkCertificationsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://admin.elevateforhumanity.org/certificates/bulk' },
  title: 'Bulk Certificates & Certifications | Admin | Elevate For Humanity',
};

export default async function BulkCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRole(['admin']);
  const { tab } = await searchParams;
  const activeTab = tab === 'manage' ? 'manage' : 'issue';
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from('certificate_templates')
    .select('id,name,description')
    .eq('status', 'active')
    .order('name');

  const { data: rawEligible, count: eligibleCount } = await supabase
    .from('program_enrollments')
    .select(
      'id,user_id,student_id,course_id,program_id,completed_at,certificate_issued_at',
      { count: 'exact' },
    )
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .is('certificate_issued_at', null)
    .limit(20);

  const issueUserIds = [
    ...new Set(
      (rawEligible ?? [])
        .map((enrollment) => enrollment.user_id || enrollment.student_id)
        .filter(Boolean),
    ),
  ] as string[];
  const issueProgramIds = [
    ...new Set((rawEligible ?? []).map((enrollment) => enrollment.program_id).filter(Boolean)),
  ] as string[];
  const issueCourseIds = [
    ...new Set((rawEligible ?? []).map((enrollment) => enrollment.course_id).filter(Boolean)),
  ] as string[];

  const [profileResult, programResult, courseResult] = await Promise.all([
    issueUserIds.length
      ? supabase.from('profiles').select('id,full_name,email').in('id', issueUserIds)
      : Promise.resolve({ data: [] as any[] }),
    issueProgramIds.length
      ? supabase.from('programs').select('id,title,name').in('id', issueProgramIds)
      : Promise.resolve({ data: [] as any[] }),
    issueCourseIds.length
      ? supabase.from('courses').select('id,title,course_name').in('id', issueCourseIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const profileMap = new Map((profileResult.data ?? []).map((row: any) => [row.id, row]));
  const programMap = new Map((programResult.data ?? []).map((row: any) => [row.id, row]));
  const courseMap = new Map((courseResult.data ?? []).map((row: any) => [row.id, row]));

  const eligibleParticipants = (rawEligible ?? []).map((enrollment) => {
    const userId = enrollment.user_id || enrollment.student_id;
    const program = enrollment.program_id ? programMap.get(enrollment.program_id) : null;
    const course = enrollment.course_id ? courseMap.get(enrollment.course_id) : null;
    return {
      id: enrollment.id,
      user_id: userId || '',
      course_id: enrollment.course_id,
      program_id: enrollment.program_id,
      completed_at: enrollment.completed_at,
      profiles: userId ? profileMap.get(userId) ?? null : null,
      learning_title:
        program?.title || program?.name || course?.title || course?.course_name || 'Completed program',
    };
  });

  const { data: certificationTypes } = await supabase
    .from('certification_types')
    .select('id,name,provider,validity_months')
    .order('name');

  const { data: rawPending, count: pendingCount } = await supabase
    .from('user_certifications')
    .select('id,user_id,certification_type_id,status,earned_date', { count: 'exact' })
    .eq('status', 'pending')
    .limit(20);

  const manageUserIds = [
    ...new Set((rawPending ?? []).map((certification) => certification.user_id).filter(Boolean)),
  ] as string[];
  const { data: manageProfiles } = manageUserIds.length
    ? await supabase.from('profiles').select('id,full_name,email').in('id', manageUserIds)
    : { data: [] };
  const manageProfileMap = new Map((manageProfiles ?? []).map((profile) => [profile.id, profile]));
  const pendingCertifications = (rawPending ?? []).map((certification) => ({
    ...certification,
    profiles: manageProfileMap.get(certification.user_id) ?? null,
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-500">
              <li><Link href="/" className="hover:text-slate-900">Admin</Link></li>
              <li>/</li>
              <li><Link href="/certificates" className="hover:text-slate-900">Certificates</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Bulk</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Bulk Certificates &amp; Certifications</h1>
          <p className="text-slate-600 mt-1">Issue verified completion certificates or review certification records</p>
        </div>

        <div className="flex gap-1 border-b border-slate-200 mb-8">
          <Link
            href="/certificates/bulk?tab=issue"
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'issue'
                ? 'border-brand-blue-600 text-brand-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Issue Certificates
            {(eligibleCount ?? 0) > 0 && (
              <span className="ml-2 bg-brand-blue-100 text-brand-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {eligibleCount}
              </span>
            )}
          </Link>
          <Link
            href="/certificates/bulk?tab=manage"
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'manage'
                ? 'border-brand-blue-600 text-brand-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Manage Certifications
            {(pendingCount ?? 0) > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>

        {activeTab === 'issue' ? (
          <BulkIssueForm
            templates={templates ?? []}
            eligibleParticipants={eligibleParticipants}
            eligibleCount={eligibleCount ?? 0}
          />
        ) : (
          <BulkCertificationsClient
            pendingCertifications={pendingCertifications}
            certificationTypes={certificationTypes ?? []}
            pendingCount={pendingCount ?? 0}
          />
        )}
      </div>
    </div>
  );
}
