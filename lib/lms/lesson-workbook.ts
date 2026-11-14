import 'server-only';
import type { SupabaseClient } from '@/lib/supabase';
import { HVAC_COURSE_ID, HVAC_WORKBOOK_SLUG, HVAC_RESPONSE_FIELDS } from './hvac-workbook-contract';
import content from './hvac-workbook-content.json';
import type { Workbook, WorkbookSection, WorkbookResponse } from './digital-workbooks';

export async function loadLessonWorkbook(
  db: SupabaseClient,
  courseId: string,
  lessonId: string,
  userId: string | undefined,
  preview = false,
) {
  if (courseId !== HVAC_COURSE_ID) return null;
  const chapter = content.chapters.find((chapter) => chapter.lesson_id === lessonId);
  if (!chapter) return null; // Separate practice examinations have no writing chapter.
  const book = await db
    .from('digital_workbooks')
    .select('id,slug,title,program_id,cover_image')
    .eq('slug', HVAC_WORKBOOK_SLUG)
    .eq('is_active', true)
    .maybeSingle();
  if (book.error || !book.data) throw new Error('Matching workbook could not be loaded.');
  const section = await db
    .from('digital_workbook_sections')
    .select('id,workbook_id,section_number,title,unit,pdf_page,prompts,lesson_id')
    .eq('workbook_id', book.data.id)
    .eq('id', chapter.section_id)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (section.error || !section.data)
    throw new Error('Matching workbook chapter could not be loaded.');
  let response: WorkbookResponse | undefined;
  let readOnly = true;
  if (!preview && userId) {
    const saved = await db
      .from('digital_workbook_responses')
      .select('section_id,answers,reviewed,version,updated_at')
      .eq('user_id', userId)
      .eq('section_id', section.data.id)
      .maybeSingle();
    if (saved.error) throw new Error('Saved workbook answers could not be loaded.');
    response = saved.data as WorkbookResponse | undefined;
    const access = await db.rpc('can_edit_digital_workbook', { p_workbook_id: book.data.id });
    if (access.error) throw new Error('Workbook access could not be verified.');
    readOnly = access.data !== true;
  }
  return {
    workbook: book.data as Workbook,
    section: { ...section.data, course_id: courseId } as WorkbookSection,
    response: response || undefined,
    accountId: userId || 'admin-preview',
    readOnly,
  };
}

export async function hasRequiredLessonWorkbook(
  db: SupabaseClient,
  courseId: string,
  lessonId: string,
  userId: string,
) {
  if (
    courseId !== HVAC_COURSE_ID ||
    !content.chapters.some((chapter) => chapter.lesson_id === lessonId)
  )
    return true;
  const workbook = await loadLessonWorkbook(db, courseId, lessonId, userId);
  const response = workbook?.response;
  return (
    response?.reviewed === true &&
    HVAC_RESPONSE_FIELDS.every(
      (key) =>
        typeof response.answers?.[key] === 'string' && response.answers[key].trim().length >= 10,
    )
  );
}
