import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = { title: 'Notifications | Elevate LMS', description: 'View learner and community notifications.' };
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/notifications');

  const [coreResult, communityResult] = await Promise.all([
    supabase.from('notifications').select('id,type,title,message,action_url,read_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(75),
    supabase.from('community_notifications').select('id,type,title,message,href,read_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(75),
  ]);

  const notifications = [
    ...(coreResult.data ?? []).map((n: any) => ({ id: n.id, type: n.type, title: n.title, message: n.message, href: n.action_url ?? null, read_at: n.read_at, created_at: n.created_at, source: 'core' as const })),
    ...(communityResult.data ?? []).map((n: any) => ({ id: n.id, type: n.type, title: n.title, message: n.message, href: n.href ?? null, read_at: n.read_at, created_at: n.created_at, source: 'community' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 100);

  return <NotificationsClient userId={user.id} initialNotifications={notifications} />;
}
