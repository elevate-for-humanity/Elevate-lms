import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = {
  title: 'Notifications | Elevate For Humanity',
  description: 'View your notifications and updates.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/notifications',
  },
};

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/notifications');
  }

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Count unread
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <NotificationsClient 
      userId={user.id}
      initialNotifications={notifications || []}
      unreadCount={unreadCount}
    />
  );
}
