import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import PageClient from './PageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from('programs').select('id, title, slug').eq('is_active', true).order('title');
  return <PageClient programs={programs ?? []} />;
}
