import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
export const dynamic = 'force-dynamic';
export default async function InterofficeEmail() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect('/login?redirect=%2Fcommunications%2Femail');
  return (
    <main className="p-4">
      <EmailWorkspace roleLabel="account holder" />
    </main>
  );
}
