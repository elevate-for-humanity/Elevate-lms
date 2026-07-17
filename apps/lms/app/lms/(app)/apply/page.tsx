import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import StudentApplicationPage from './ApplyClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireRole(['student', 'staff', 'admin', 'super_admin']);
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from('programs').select('id, title, slug')
    .eq('is_active', true).eq('published', true).order('title');
  return <StudentApplicationPage programs={programs ?? []} />;
}
