import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AITeamConsole from '@/components/platform/AITeamConsole';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'AI Team | Elevate LMS',
  description: 'Work with PARIS, ELLIE, LIZZY, and ZORA from one learner workspace.',
  robots: { index: false, follow: false },
};

export default async function LearnerAITeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/ai-team');

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <AITeamConsole title="Your AI Team" />
    </main>
  );
}
