import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MessagesClient from './MessagesClient';

export const metadata: Metadata = {
  title: 'Messages | Elevate For Humanity',
  description: 'Direct messages with community members.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/messages',
  },
};

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/messages');
  }

  // Fetch conversations
  const { data: conversations } = await supabase
    .from('direct_message_conversations')
    .select(`
      id,
      participant_1_id,
      participant_2_id,
      last_message_at,
      last_message_preview
    `)
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  // Get participant details
  const participantIds = new Set<string>();
  conversations?.forEach(c => {
    if (c.participant_1_id !== user.id) participantIds.add(c.participant_1_id);
    if (c.participant_2_id !== user.id) participantIds.add(c.participant_2_id);
  });

  const participants: Record<string, any> = {};
  if (participantIds.size > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', Array.from(participantIds));

    users?.forEach(u => {
      participants[u.id] = u;
    });
  }

  return (
    <MessagesClient 
      userId={user.id}
      initialConversations={conversations || []}
      participants={participants}
    />
  );
}
