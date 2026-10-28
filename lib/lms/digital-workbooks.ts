import 'server-only';
import { createClient } from '@/lib/supabase/server';

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
  if (authError || !user) return { user: null, workbooks: [] as Workbook[] };
  const { data, error } = await db
    .from('digital_workbooks')
    .select('id,slug,title,program_id,cover_image')
    .eq('is_active', true)
    .order('title');
  if (error) throw new Error('Your workbooks could not be loaded. Please try again.');
  return { user, workbooks: (data ?? []) as Workbook[] };
}

export async function loadMyDigitalWorkbook(slug: string) {
  const { user, workbooks } = await loadMyDigitalWorkbooks();
  const workbook = workbooks.find((book) => book.slug === slug);
  if (!user || !workbook) return null;
  const db = await createClient();
  const { data: sections, error } = await db
    .from('digital_workbook_sections')
    .select('id,workbook_id,section_number,title,unit,pdf_page,prompts,lesson_id')
    .eq('workbook_id', workbook.id)
    .order('section_number');
  if (error) throw new Error('Workbook sections could not be loaded. Please try again.');
  const typedSections = (sections ?? []) as WorkbookSection[];
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
  // An admin can inspect published resources but cannot write on a student's behalf.
  const enrollment = await db
    .from('program_enrollments')
    .select('id')
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .eq('program_id', workbook.program_id)
    .is('revoked_at', null)
    .in('status', ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'])
    .limit(1);
  if (enrollment.error) throw new Error('Workbook access could not be verified.');
  return { workbook, sections: typedSections, responses, readOnly: !enrollment.data?.length };
}
