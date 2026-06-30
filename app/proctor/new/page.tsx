import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import NewExamSession from './ProctorNewClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireRole(['admin', 'super_admin', 'staff', 'instructor']);
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from('programs').select('id, title, slug')
    .eq('is_active', true).order('title');
  return <NewExamSession programs={programs ?? []} />;
}
