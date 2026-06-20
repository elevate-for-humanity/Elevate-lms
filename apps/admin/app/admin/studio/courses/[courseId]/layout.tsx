import { notFound } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';

export default async function AdminCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await requireAdminClient();

  if (!supabase) return notFound();

  const { data: course } = await supabase
    .from('lms_courses')
    .select('id')
    .eq('id', courseId)
    .maybeSingle();

  if (!course) notFound();

  return children;
}
