export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function LMSCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const db = admin || supabase;

  if (!db) return notFound();

  const { data: course } = await db
    .from('training_courses')
    .select('id')
    .eq('id', courseId)
    .single();

  if (!course) notFound();

  return children;
}
