import StandardStudentApplicationPage from '@/apps/marketing/app/apply/student/form/page';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Medical Assistant Enrollment Application | Elevate for Humanity', robots: { index: false, follow: true } };
/** Keep this bookmarked entry working without a login redirect or a second intake API. */
export default async function ProgramEnrollment({ searchParams }: { searchParams: Promise<{ intent?: string; session_id?: string }> }) {
 const params = await searchParams;
 return StandardStudentApplicationPage({ searchParams: Promise.resolve({ program: 'medical-assistant', intent: 'enrollment', ...(params.session_id ? { session_id: params.session_id } : {}) }) });
}
