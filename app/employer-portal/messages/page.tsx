export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import MessagesClient from './MessagesClient';

export const metadata: Metadata = {
  title: 'Messages | Employer Portal',
  description: 'Communicate with candidates and the Elevate team.',
  robots: { index: false, follow: false },
};

export default async function EmployerMessagesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/messages');
  }

  // Fetch conversations where this user is a participant
  const { data: conversations } = await db
    .from('conversations')
    .select('*')
    .contains('participant_ids', [user.id])
    .order('last_message_at', { ascending: false })
    .limit(50);

  // Get other participants' profiles
  const participantIds = new Set<string>();
  (conversations || []).forEach(c => {
    (c.participant_ids || []).forEach((pid: string) => {
      if (pid !== user.id) participantIds.add(pid);
    });
  });

  const { data: profiles } = participantIds.size > 0
    ? await db
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('id', Array.from(participantIds))
    : { data: [] };

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  const enrichedConversations = (conversations || []).map(c => {
    const otherId = (c.participant_ids || []).find((pid: string) => pid !== user.id);
    const otherProfile = otherId ? profileMap.get(otherId) : null;
    return {
      ...c,
      other_name: otherProfile?.full_name || 'Unknown',
      other_avatar: otherProfile?.avatar_url || null,
      other_role: otherProfile?.role || 'user',
    };
  });

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Employer Portal', href: '/employer-portal' }, { label: 'Messages' }]} />
      <MessagesClient
        conversations={enrichedConversations}
        currentUserId={user.id}
      />
    </div>
  );
}
