import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import NewAutomationClient from './NewAutomationClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function Page() {
  await requireRole(['admin', 'staff']);
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from('programs').select('id, title, slug').eq('is_active', true).order('title');
  return <NewAutomationClient programs={programs ?? []} />;
}
