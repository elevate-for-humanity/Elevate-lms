import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { getInstructorCurriculumLicenseStatus } from '@/lib/legal/instructorCurriculumLicense';
import { HVAC_COURSE_ID } from '@/lib/lms/hvac-workbook-contract';

export type Workbook = {
  id: string;
  slug: string;
  title: string;
  program_id: string;
  cover_image: string;
};
export type WorkbookSection = {
  id: string;
  workbook_id: string;
  section_number: number;
  title: string;
  unit: string;
  pdf_page: number;
  prompts: string[];
  lesson_id: string | null;
  course_id?: string | null;
};
export type WorkbookResponse = {
  section_id: string;
  answers: Record<string, string>;
  reviewed: boolean;
  version: number;
  updated_at: string;
};

/** Session-scoped client: RLS is the authority for enrollment and lesson pacing. */
export async function loadMyDigitalWorkbooks() {
  const db = await createClient();
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  const admin = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(admin, user?.id);
  if ((!user || authError) && !subject.previewing)
    return { user: null, workbooks: [] as Workbook[], previewing: false };
  let reader = db;
  let programIds: string[] = [];
  if (subject.previewing) {
    const result = await admin
      .from('program_enrollments')
      .select('program_id')
      .or(`user_id.eq.${subject.userId},student_id.eq.${subject.userId}`)
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'])
      .is('revoked_at', null);
    if (result.error) throw new Error('Workbook enrollment could not be verified.');
    programIds = [
      ...new Set((result.data || []).map((row) => row.program_id).filter(Boolean)),
    ] as string[];
    const teaching = await admin.from('instructor_assignments').select('course_id')
      .eq('instructor_id', subject.userId).eq('active', true);
    if (teaching.error) throw new Error('Workbook teaching access could not be verified.');
    const teachingIds = (teaching.data ?? []).map(row => row.course_id).filter(Boolean);
    if (teachingIds.length) {
      const courses = await admin.from('courses').select('id,program_id')
        .in('id', teachingIds).eq('is_active', true).eq('status', 'published');
      if (courses.error) throw new Error('Workbook teaching programs could not be verified.');
      let teachingPrograms = (courses.data ?? [])
        .map((row) => ({ courseId: String(row.id), programId: row.program_id }))
        .filter((row) => row.programId);
      // Proprietary-curriculum gate: teaching the HVAC course also requires
      // the current instructor IP license. Without it, the HVAC program is
      // excluded from the teaching workbook set; other teaching programs pass
      // through unchanged. (Assignment itself is already proven above.)
      const hvacTeaching = teachingPrograms.filter((row) => row.courseId === HVAC_COURSE_ID);
      if (hvacTeaching.length) {
        const licenseStatus = await getInstructorCurriculumLicenseStatus(admin, subject.userId);
        if (!licenseStatus.authorized) {
          const hvacProgramIds = new Set(hvacTeaching.map((row) => row.programId));
          teachingPrograms = teachingPrograms.filter((row) => !hvacProgramIds.has(row.programId));
        }
      }
      programIds = [...new Set([...programIds, ...teachingPrograms.map((row) => row.programId)])];
    }
    if (!programIds.length)
      return { user: { id: subject.userId }, workbooks: [] as Workbook[], previewing: true };
    reader = admin;
  }
  let query = reader
    .from('digital_workbooks')
    .select('id,slug,title,program_id,cover_image')
    .eq('is_active', true);
  if (subject.previewing) query = query.in('program_id', programIds);
  const { data, error } = await query.order('title');
  if (error) throw new Error('Your workbooks could not be loaded. Please try again.');
  return {
    user: subject.previewing ? { id: subject.userId } : user,
    workbooks: (data ?? []) as Workbook[],
    previewing: subject.previewing,
  };
}

export async function loadMyDigitalWorkbook(slug: string) {
  const { user, workbooks, previewing } = await loadMyDigitalWorkbooks();
  const workbook = workbooks.find((book) => book.slug === slug);
  if (!user || !workbook) return null;
  const db = previewing ? await requireAdminClient() : await createClient();
  const { data: sections, error } = await db
    .from('digital_workbook_sections')
    .select('id,workbook_id,section_number,title,unit,pdf_page,prompts,lesson_id')
    .eq('workbook_id', workbook.id)
    .order('section_number');
  if (error) throw new Error('Workbook sections could not be loaded. Please try again.');
  let typedSections = (sections ?? []) as WorkbookSection[];
  // Administrator previews may inspect the assigned workbook, including future sections.
  // Learner reads use workbook RLS; study-window restrictions belong to video/time credit.
  if (previewing) {
    const linked = typedSections.map((section) => section.lesson_id).filter(Boolean) as string[];
    if (linked.length) {
      const published = await db.from('course_lessons').select('id')
        .in('id', linked).eq('is_published', true).eq('status', 'published');
      if (published.error) throw new Error('Workbook publication could not be verified.');
      const publishedIds = new Set((published.data || []).map((lesson) => lesson.id));
      typedSections = typedSections.filter((section) => !section.lesson_id || publishedIds.has(section.lesson_id));
    }
  }
  const lessonIds = typedSections.map((section) => section.lesson_id).filter(Boolean) as string[];
  if (lessonIds.length) {
    const lessons = await db.from('course_lessons').select('id,course_id').in('id', lessonIds);
    if (lessons.error) throw new Error('Workbook theory links could not be loaded.');
    const courses = new Map((lessons.data || []).map((lesson) => [lesson.id, lesson.course_id]));
    typedSections = typedSections.map((section) => ({
      ...section,
      course_id: section.lesson_id ? courses.get(section.lesson_id) || null : null,
    }));
  }
  const ids = typedSections.map((section) => section.id);
  let responses: WorkbookResponse[] = [];
  if (ids.length) {
    const result = await db
      .from('digital_workbook_responses')
      .select('section_id,answers,reviewed,version,updated_at')
      .eq('user_id', user.id)
      .in('section_id', ids);
    if (result.error) throw new Error('Saved answers could not be loaded. Please try again.');
    responses = (result.data ?? []) as WorkbookResponse[];
  }
  // The database checks enrollment or this buyer's paid workbook entitlement.
  const access = previewing
    ? { data: false, error: null }
    : await db.rpc('can_edit_digital_workbook', { p_workbook_id: workbook.id });
  if (access.error) throw new Error('Workbook access could not be verified.');
  return {
    workbook,
    sections: typedSections,
    responses,
    readOnly: access.data !== true,
    accountId: user.id,
  };
}
