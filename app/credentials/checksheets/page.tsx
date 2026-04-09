import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import ChecksheetsContent from './ChecksheetsContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Performance Checksheets | Elevate HVAC Training',
  description: 'OJT skill verification checksheets for HVAC technician training performance competencies.',
};

export default async function ChecksheetsPage() {
  const db = await getAdminClient();

  // Pull live lesson data so checksheet competency codes link to real lessons
  const { data: lessons } = await db
    .from('curriculum_lessons')
    .select('id, title, lesson_number, slug, status')
    .eq('status', 'published')
    .order('lesson_number', { ascending: true });

  const lessonMap = new Map(
    (lessons ?? []).map((l: any) => [l.lesson_number, { id: l.id, title: l.title, slug: l.slug }])
  );

  return <ChecksheetsContent lessonMap={lessonMap} />;
}
