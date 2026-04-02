import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import HVACStandardsContent from './HVACStandardsContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'HVAC Competency Standards | Elevate Training',
  description: 'HVAC EPA 608 competency framework — domain codes, theory hours, OJT hours, and lesson mappings.',
};

export default async function HVACStandardsPage() {
  const db = createAdminClient();

  const { data: lessons } = await db
    .from('curriculum_lessons')
    .select('id, title, lesson_number, slug, status')
    .eq('status', 'published')
    .order('lesson_number', { ascending: true });

  const lessonMap = new Map(
    (lessons ?? []).map((l: any) => [l.lesson_number, { id: l.id, title: l.title, slug: l.slug }])
  );

  return <HVACStandardsContent lessonMap={lessonMap} />;
}
