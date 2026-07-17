export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DocumentsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/programs/${program}/documents`);

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, status, orientation_completed_at, documents_submitted_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment) redirect(`/programs/${program}`);
  if (!enrollment.orientation_completed_at) redirect(`/programs/${program}/orientation`);
  if (enrollment.documents_submitted_at) redirect('/apprentice');

  return <>{children}</>;
}
