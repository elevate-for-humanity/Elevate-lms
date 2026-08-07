import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AITeamConsole from '@/components/platform/AITeamConsole';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'AI Team | Account', robots: { index: false, follow: false } };

export default async function AITeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account/ai-team');

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl"><AITeamConsole /></div>
    </main>
  );
}
