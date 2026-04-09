import { notFound } from 'next/navigation';
import { getAdminClient } from '@/lib/supabase/admin';

export default async function ProgramLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getAdminClient();

  if (!supabase) return notFound();

  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!program) notFound();

  return children;
}
