import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { HVAC_COURSE_ID } from '@/lib/courses/hvac-uuids';
import { isAssignedCourseInstructor } from '@/lib/lms/instructor-course-access';
import {
  INSTRUCTOR_CURRICULUM_IP_DOCUMENT_URL,
  getInstructorCurriculumLicenseStatus,
} from '@/lib/legal/instructorCurriculumLicense';
import { requireAdminClient } from '@/lib/supabase/admin';
import { siteUrls } from '@/lib/utils/site-urls';
import HvacSimulationReview from '@/components/lms/HvacSimulationReview';
import HvacSystemLab from '@/components/lms/HvacSystemLab';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Instructor Course Workspace', robots: { index: false, follow: false } };

export default async function InstructorCourseWorkspace({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId: requestedCourseId } = await params;
  const courseId = requestedCourseId.toLowerCase();
  const { user, effectiveRoles } = await requireRole(['instructor', 'admin', 'super_admin']);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(courseId)) notFound();

  const db = await requireAdminClient();
  const isAdmin = effectiveRoles.some(role => role === 'admin' || role === 'super_admin');
  if (!isAdmin && !await isAssignedCourseInstructor(db, user.id, courseId)) notFound();

  // Proprietary-curriculum gate (HVAC only): teaching this course also
  // requires the current instructor IP license. The general instructor
  // services agreement does not satisfy it. Other courses keep the
  // assignment-only rule.
  let instructorLicenseRef: string | null = null;
  if (!isAdmin && courseId === HVAC_COURSE_ID) {
    const licenseStatus = await getInstructorCurriculumLicenseStatus(db, user.id, { courseId });
    if (!licenseStatus.authorized) {
      return (
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <Link href="/instructor/courses" className="inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline">My courses</Link>
          <h1 className="mt-3 break-words text-3xl font-black text-slate-950">Instructor license required</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-700">
            Teaching the HVAC course requires the current Proprietary Curriculum and Authorized
            Instructor License (version {licenseStatus.agreementVersion}). Your license status
            is: {licenseStatus.reason}. The general instructor services agreement does not
            satisfy this requirement.
          </p>
          <a
            href={`${siteUrls.site}${INSTRUCTOR_CURRICULUM_IP_DOCUMENT_URL}`}
            className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand-blue-700 px-4 py-3 font-bold text-white"
          >
            Read and sign the instructor license agreement
          </a>
        </main>
      );
    }
    instructorLicenseRef = licenseStatus.licenseReference;
  }

  const { data: course, error } = await db.from('lms_courses').select('id,title').eq('id', courseId).maybeSingle();
  if (error) throw new Error('Instructor course could not be loaded');
  if (!course) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/instructor/courses" className="inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline">My courses</Link>
      {instructorLicenseRef ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-100 p-4 text-sm font-bold text-amber-950">
          Licensed instructor view · Ref {instructorLicenseRef} · Elevate proprietary curriculum
          — for assigned teaching only. Do not copy, redistribute, or share.
        </div>
      ) : null}
      <h1 className="mt-3 break-words text-3xl font-black text-slate-950">{course.title}</h1>
      <nav aria-label="Course resources" className="mt-5 flex flex-wrap gap-3">
        <Link href={`/instructor/courses/${course.id}/assignments`} className="inline-flex min-h-11 items-center rounded-lg border px-4 font-bold">Assignments</Link>
        <Link href={`/instructor/courses/${course.id}/gradebook`} className="inline-flex min-h-11 items-center rounded-lg border px-4 font-bold">Gradebook</Link>
        {course.id === HVAC_COURSE_ID && (
          <a href={`${siteUrls.site}/docs/syllabi/hvac-technician.md`} className="inline-flex min-h-11 items-center rounded-lg bg-brand-blue-700 px-4 font-bold text-white">View HVAC syllabus</a>
        )}
      </nav>
      {course.id === HVAC_COURSE_ID && <HvacSystemLab />}
      {course.id === HVAC_COURSE_ID && <HvacSimulationReview />}
    </main>
  );
}
