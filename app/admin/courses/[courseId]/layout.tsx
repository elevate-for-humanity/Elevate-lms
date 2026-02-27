import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = createAdminClient();

  if (!supabase) return notFound();

  const { data: course } = await supabase
    .from('training_courses')
    .select('id')
    .eq('id', courseId)
    .single();

  if (!course) notFound();

  return children;
}
