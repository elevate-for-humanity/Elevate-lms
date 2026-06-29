import { requireRole } from '@/lib/auth/require-role';
import { createClient, safeGetUser } from '@/lib/supabase/server';

export default async function Page() {
  await requireRole('employer');
  const supabase = await createClient();
  const user = safeGetUser(await supabase.auth.getUser());
  return <div>Weekly Report</div>;
}
