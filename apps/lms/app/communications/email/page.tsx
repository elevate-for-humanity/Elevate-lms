import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
export const dynamic = 'force-dynamic';
export default async function InterofficeEmail({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; subject?: string }>;
}) {
  const params = await searchParams;
  const initialRecipient =
    typeof params.to === 'string' && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(params.to)
      ? params.to.slice(0, 254)
      : undefined;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect('/login?redirect=%2Fcommunications%2Femail');
  return (
    <main className="p-4">
      <EmailWorkspace
        roleLabel="account holder"
        initialRecipient={initialRecipient}
        initialSubject={typeof params.subject === 'string' ? params.subject.slice(0, 200) : ''}
      />
    </main>
  );
}
